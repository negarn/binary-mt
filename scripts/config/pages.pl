#!/usr/bin/perl

use strict;
use warnings;

sub all_pages {
    return (
        # url pathname,                template file path,             layout,       title,        exclude languages
        ['home',                       'home/index',                   'full_width', 'Online Trading platform for binary options on Forex, Indices, Commodities and Smart Indices'],
        ['logged_inws',                'global/logged_inws',           undef],

        ['metatrader',                      'metatrader/index',         'default', 'Trading with MetaTrader 5'],
        ['metatrader/download',             'metatrader/download',      'default', 'Start Trading with MetaTrader 5'],
        ['user/settings/metatrader',        'user/settings/metatrader', 'default', 'MetaTrader'],
    );
}

1;
