module.exports = function (config) {
    config.set({
        frameworks: ['browserify','jasmine'],
        plugins: [
            'karma-browserify',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-coverage',
        ],
        files:[
            'node_modules/jquery/dist/jquery.js',
            'src/**/*.js',
            'test/**/*.js',
            // JSON fixture
            { pattern:  'test/data-json-filelist.json',
                watched:  true,
                served:   true,
                included: false },
            { pattern:  'test/data/*.json',
                watched:  true,
                served:   true,
                included: false },
            { pattern:  'test/data/csv/*.csv',
                watched:  true,
                served:   true,
                included: false }
        ],

        preprocessors: {
            'src/**/*.js': ['browserify'],
            'test/**/*.js': ['browserify']
        },

        browserify: {
            debug: true,
            "transform": [
                [
                    "babelify",
                    {
                        "presets": [
                            "@babel/preset-env"
                        ],
                        "plugins": [
                            "transform-class-properties",
                            "transform-object-assign",
                            [
                                "babel-plugin-transform-builtin-extend",
                                {
                                    "globals": [
                                        "Error"
                                    ]
                                }
                            ],
                            "istanbul"
                        ]
                    },
                ]

            ]
        },

        // start these browsers
        browsers: ['ChromeHeadless', 'Firefox'],
        reporters: ['progress', 'coverage'],
        logLevel: config.LOG_WARN,
        singleRun: false,
        browserConsoleLogOptions: {
            terminal: true,
            level: ""
        },

        coverageReporter: {
            reporters: [
                // {'type': 'text'},
                {'type': 'html', dir: 'coverage'},
                {'type': 'lcov'}
            ]
        },
        client: {
            jasmine: {
                random: false
            }
        }
    });
};
