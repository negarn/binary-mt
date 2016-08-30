#!/usr/bin/perl

use strict;
use warnings;

sub all_pages {
    return (
        # url pathname,                template file path,             layout,       title,        exclude languages
        ['home',                       'home/index',                   'full_width', 'Online Trading platform for binary options on Forex, Indices, Commodities and Smart Indices'],
        ['logged_inws',                'global/logged_inws',           undef],

        ['download-metatrader',             'static/download',      'default',    'Start Trading with MetaTrader 5'],
        ['user/settings/metatrader',        'user/settings/metatrader', 'default',    'MetaTrader'],
        ['margin-policy',                   'static/margin-policy',     'default',    'MetaTrader Margin Policy'],
        ['volatility-indices-contract',     'static/volatility-indices-contract',   'default',    'Volatility Indices Contract Specifications'],
    );
}

1;
