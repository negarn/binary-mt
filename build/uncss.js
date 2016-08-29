module.exports = {
    all: {
        options: {
            ignore: ['#added_at_runtime', /test\-[0-9]+/],
            media: ['(min-width: 700px) handheld and (orientation: landscape)'],
            stylesheets: ['../dist/css/binary.min.css'],
            urls: [
                'https://mt5.binary.com'
            ],
            timeout: 1000,
            report: 'min'
        },
        files: {
            'dist/css/binary.css': ['build/empty.html']
        }
    }
};
