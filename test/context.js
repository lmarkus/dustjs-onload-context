'use strict';


var test = require('tape'),
    dust = require('dustjs-linkedin'),
    contextify = require('../');


test('dustjs-onload-context', function (t) {

    t.test('original', function (t) {

        t.plan(4);

        dust.onLoad = function (name, cb) {
            t.equals(name, 'index');
            cb(null, 'Hello, {name}!');
        };

        dust.render('index', { name: 'world' }, function (err, data) {
            t.error(err);
            t.equal(data, 'Hello, world!');
            t.equal(typeof dust.cache.index, 'function');

            dust.cache = {};

            t.end();
        });

    });


    t.test('patched without context', function (t) {
        var undo = contextify();

        t.plan(7);

        dust.onLoad = function (name, cb) {
            t.equals(name, 'index');
            t.equals(typeof cb, 'function');
            cb(null, 'Hello, {name}!');
        };

        dust.render('index', { name: 'world' }, function (err, data) {
            t.error(err);
            t.equal(data, 'Hello, world!');
            t.equal(typeof dust.cache.index, 'function');
            t.equal(dust.load.name, 'cabbage');

            dust.cache = {};
            undo();

            t.equal(dust.load.name, '');
            t.end();
        });

    });


    t.test('with context', function (t) {
        var undo = contextify();

        t.plan(9);

        dust.onLoad = function (name, context, cb) {
            t.equals(name, 'index');
            t.equals(typeof context, 'object');
            t.equals(context.get('name'), 'world');
            t.equals(typeof cb, 'function');
            cb(null, 'Hello, {name}!');
        };

        dust.render('index', { name: 'world' }, function (err, data) {
            t.error(err);
            t.equal(data, 'Hello, world!');
            t.equal(typeof dust.cache.index, 'function');
            t.equal(dust.load.name, 'cabbage');

            dust.cache = {};
            undo();

            t.equal(dust.load.name, '');
            t.end();
        });

    });


    t.test('prime cache on load', function (t) {
        var undo = contextify();

        t.plan(9);

        dust.onLoad = function (name, context, cb) {
            t.equals(name, 'index');
            t.equals(typeof context, 'object');
            t.equals(context.get('name'), 'world');
            t.equals(typeof cb, 'function');

            dust.loadSource(dust.compile('Hello, {name}!', 'index'));
            cb(null);
        };

        dust.render('index', { name: 'world' }, function (err, data) {
            t.error(err);
            t.equal(data, 'Hello, world!');
            t.equal(typeof dust.cache.index, 'function');
            t.equal(dust.load.name, 'cabbage');

            dust.cache = {};
            undo();

            t.equal(dust.load.name, '');
            t.end();
        });

    });


    t.test('cache disabled', function (t) {
        var undo = contextify({ cache: false });

        t.plan(9);

        dust.onLoad = function (name, context, cb) {
            t.equals(name, 'index');
            t.equals(typeof context, 'object');
            t.equals(context.get('name'), 'world');
            t.equals(typeof cb, 'function');

            dust.loadSource(dust.compile('Hello, {name}!', 'index'));
            cb(null);
        };

        dust.render('index', { name: 'world' }, function (err, data) {
            t.error(err);
            t.equal(data, 'Hello, world!');
            t.equal(typeof dust.cache.index, 'undefined');
            t.equal(dust.load.name, 'cabbage');

            dust.cache = {};
            undo();

            t.equal(dust.load.name, '');
            t.end();
        });

    });


    t.test('error', function (t) {
        var undo = contextify();

        t.plan(7);

        dust.silenceErrors = true;
        dust.onLoad = function (name, context, cb) {
            t.ok(name);
            t.ok(context);
            t.ok(cb);
            cb(new Error('test'));
        };

        dust.render('index', { name: 'world' }, function (err, data) {
            t.ok(err);
            t.equal(data, undefined);
            t.equal(dust.load.name, 'cabbage');

            dust.cache = {};
            undo();

            t.equal(dust.load.name, '');
            t.end();
        });

    });


    t.test('cached template', function (t) {
        var undo = contextify();

        t.plan(2);

        dust.onLoad = function (name, context, cb) {
            cb(new Error('Should not be called'));
        };

        dust.loadSource(dust.compile('Hello, {name}!', 'index'));
        dust.render('index', { name: 'world' }, function (err, data) {
            t.error(err);
            t.equal(data, 'Hello, world!');

            dust.cache = {};
            undo();

            t.end();
        });

    });


    t.test('undo', function (t) {
        var undo = contextify();

        t.plan(7);

        dust.onLoad = function (name, context, cb) {
            switch (name) {
                case 'index':
                    setImmediate(cb.bind(null, null, 'Hello, {>"partial"/}!'));
                    undo();
                    break;
                case 'partial':
                    setImmediate(cb.bind(null, null, '{name}'));
                    break;
            }
        };

        dust.render('index', { name: 'world'}, function (err, data) {
            t.error(err);
            t.equal(data, 'Hello, world!');
            t.equal(dust.load.name, 'cabbage');
        });

        dust.render('index', { name: 'world'}, function (err, data) {
            t.error(err);
            t.equal(data, 'Hello, world!');
            t.equal(dust.load.name, 'cabbage');

            dust.cache = {};

            setImmediate(function () {
                t.equal(dust.load.name, '');
                t.end();
            });
        });

    });

});