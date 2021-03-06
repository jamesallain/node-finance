"use strict";

// This script installs the design doc. Don't forget to create the database.

/* global emit, sum */

const util = require("../lib/util");

const request = util.request;

const cfg = {
    url: "http://user1:pass1@x.y.com",
    db: "dbName",
    design: "_design/designDocName"
};

function saveDesignDoc(rev) {
    const designDoc = {
        _id: cfg.design,

        _rev: rev,

        language: "javascript",

        views: {
            viewByRef: {
                map: function(doc) {
                    if (doc.ref) {
                        emit(doc.ref, 1);
                    }
                }.toString(),
                reduce: function(keys, values) {
                    return sum(values);
                }.toString()
            },
            viewByCreatedAt: {
                map: function(doc) {
                    if (doc.created_at) {
                        emit(doc.created_at, doc);
                    }
                }.toString()
            },
            viewByRet: {
                map: function(doc) {
                    if (doc.ret) {
                        emit(parseFloat(doc.ret), doc);
                    }
                }.toString()
            },
            viewByRisk: {
                map: function(doc) {
                    if (doc.risk) {
                        emit(parseFloat(doc.risk), doc);
                    }
                }.toString()
            },
            viewByPerf: {
                map: function(doc) {
                    if (doc.perf) {
                        emit(parseFloat(doc.perf), doc);
                    }
                }.toString()
            },
            viewMostUsedAssets: {
                map: function(doc) {
                    if (doc.assets) {
                        doc.assets.forEach(asset => {
                            emit(asset, 1);
                        });
                    }
                }.toString(),
                reduce: function(keys, values, rereduce) {
                    const MAX = 10,
                        top = [];

                    let tags = {},
                        lastkey = null,
                        k,
                        v,
                        t,
                        n;

                    if (!rereduce) {
                        for (k in keys) {
                            if (keys.hasOwnProperty(k)) {
                                if (tags[keys[k][0]]) {
                                    tags[keys[k][0]] += values[k];
                                } else {
                                    tags[keys[k][0]] = values[k];
                                }
                            }
                        }
                        lastkey = keys[keys.length - 1][0];
                    } else {
                        tags = values[0];
                        for (v = 1; v < values.length; v += 1) {
                            for (t in values[v]) {
                                if (values[v].hasOwnProperty(t)) {
                                    if (tags[t]) {
                                        tags[t] += values[v][t];
                                    } else {
                                        tags[t] = values[v][t];
                                    }
                                }
                            }
                        }
                    }

                    for (t in tags) {
                        if (tags.hasOwnProperty(t)) {
                            if (t) {
                                top[top.length] = [t, tags[t]];
                            }
                        }
                    }

                    function sortTags(a, b) {
                        return b[1] - a[1];
                    }

                    top.sort(sortTags);

                    for (n = MAX; n < top.length; n += 1) {
                        if (top[n][0] !== lastkey) {
                            tags[top[n][0]] = undefined; // eslint-disable-line no-undefined
                        }
                    }

                    return tags;
                }.toString()
            }
        }
    };

    request({
        method: "PUT",
        url: `${cfg.url}/${cfg.db}/${cfg.design}`,
        body: designDoc
    }, (err, response, doc) => {
        if (!err) {
            util.log(doc);
        } else {
            util.log("Design doc not saved.");
        }
    });
}

request({
    method: "GET",
    url: `${cfg.url}/${cfg.db}/${cfg.design}`
}, (err, response, doc) => {
    if (!err) {
        saveDesignDoc(doc._rev); // eslint-disable-line no-underscore-dangle
    }
});
