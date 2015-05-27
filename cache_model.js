angular.module("cachemod", ["restmod"]);

angular.module("cachemod").provider("CacheModel", CacheModel);

CacheModel.$inject = [];

function CacheModel() {
    this.$get = get;
    this.setCache = setCache;

    var cacheServiceName;
    var defaultCache = {
        get: function() {
            var store = {};
            return {
                put: function(k, v) {
                    store[k] = v;
                },
                get: function(k) {
                    return store[k];
                }
            };
        }
    };

    function setCache(serviceName) {
        cacheServiceName = serviceName;
    }

    get.$inject = ["restmod", "$injector"];

    function get(restmod, $injector) {
        var cacheService = cacheServiceName ? $injector.get(cacheServiceName) : defaultCache;

        return restmod.mixin(function() {
            var cache = cacheService.get();

            this.define("Model.$new", function(_key, _scope) {
                return cachedResponse.apply(this, [_key, arguments]);
            }).define("Collection.$fetch", function() {
                return cachedResponse.apply(this, [this.$url(), arguments]);
            }).define("Record.$fetch", function() {
                //TODO: properly distinguish between singletons and instances?
                if (this.$pk === "") {
                    return cachedResponse.apply(this, [this.$url(), arguments]);
                }

                return this.$super.apply(this, arguments);
            }).define("Record.$decode", function() {
                var result = this.$super.apply(this, arguments);
                cache.put(result.$pk || this.$url(), this);
                return result;
            });

            function cachedResponse(key, args) {
                if (key === undefined)
                    return this.$super.apply(this, args);

                var cached = cache.get(key);
                if (cached === undefined) {
                    cached = this.$super.apply(this, args);
                    cache.put(key, cached);
                }

                return cached;
            }
        });
    }
}
