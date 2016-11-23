#!/usr/bin/perl

use strict;
use warnings;

sub all_pages {
    return (
        # url pathname,              template file path,         layout,       title,        exclude languages
        ['home',                     'home/index',               'full_width', 'Online Trading platform for binary options on Forex, Indices, Commodities and Smart Indices'],
        ['404',                      'static/404',               'full_width', '404'],
        ['user/settings/metatrader', 'user/settings/metatrader', 'default',    'MetaTrader'],
        ['user/tnc_approvalws',      'user/tnc_approvalws',      'default',    'Terms and Conditions Approval'],
        ['margin-policy',            'static/margin-policy',     'default',    'MetaTrader Margin Policy'],
        ['terms-and-conditions',     'legal/tac',                'default',    'MetaTrader Terms and Conditions'],
        ['download-metatrader',      'static/download',          'default',    'Start Trading with MetaTrader 5'],
        ['endpoint',                 'static/endpoint',          'default',    'Endpoint'],
        ['logged_inws',              'global/logged_inws',       undef],

        ['volatility-indices-contract', 'static/volatility-indices-contract',   'default', 'Volatility Indices Contract Specifications'],
        ['user/settings/assessmentws',  'user/settings/financial_assessmentws', 'default', 'Financial Assessment'],
    );
}

1;
