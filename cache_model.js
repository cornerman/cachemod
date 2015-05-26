angular.module("cachemod", ["restmod"]);

angular.module("cachemod").provider("CacheModel", CacheModel);

CacheModel.$inject = [];

function CacheModel() {
    this.$get = get;
    this.setCache = setCache;

    var cacheServiceName;
    var store = {};
    var defaultCache = {
        put: function(k,v) {
            store[k] = v;
        },
        get: function(k) {
            return store[k];
        }
    };

    function setCache(serviceName) {
        cacheServiceName = serviceName;
    }

    get.$inject = ["restmod", "$injector"];
    function get(restmod, $injector) {
        var cacheService = cacheServiceName ? $injector.get(cacheServiceName) : defaultCache;

        return {
            $extend: {
                Model: {
                    "$find": function(_pk) {
                        var url = this.$url() + "/" + _pk;
                        return cachedResponse.bind(this)(url, arguments);
                    }
                },
                Collection: {
                    "$fetch": function() {
                        return cachedResponse.bind(this)(this.$url(), arguments);
                    }
                }
            }
        };

        function cachedResponse(url, args) {
            var cached = cacheService.get(url);
            if (cached === undefined) {
                cached = this.$super.apply(this, args);
                cacheService.put(url, cached);
            }

            return cached;
        }
    }
}
