package GenerateStaticData;

use strict;
use warnings;
use v5.10;

use JSON qw(to_json);
use File::Slurp;
use YAML::XS qw(LoadFile);
# our module in lib
use BS;

sub generate_data_files {
    my $js_path = shift;

    _make_nobody_dir($js_path);
    print "\tGenerating $js_path/texts.js\n";
    File::Slurp::write_file("$js_path/texts.js", {binmode => ':utf8'}, _texts());

    return;
}

sub _texts {
    my $js = "var texts_json = {};\n";
    foreach my $language ((BS::all_languages(), 'ACH')) {
        BS::set_lang($language);
        my @texts;

        # strings for user/settings/metatrader page
        push @texts, localize('Demo');
        push @texts, localize('Financial');
        push @texts, localize('Volatility Indices');
        push @texts, localize('log in');
        push @texts, localize('Balance');
        push @texts, localize('Name');
        push @texts, localize('To create a Financial Account for MT5, please switch to your [_1] Real Account.');
        push @texts, localize('To create a Financial Account for MT5, please <a href="[_1]"> upgrade to [_2] Real Account</a>.');
        push @texts, localize('To create a Volatility Indices Account for MT5, please switch to your [_1] Real Account.');
        push @texts, localize('To create a Volatility Indices Account for MT5, please <a href="[_1]"> upgrade to [_2] Real Account</a>.');
        push @texts, localize('To create a Financial Account for MT5, please complete the <a href="[_1]">Financial Assessment</a>.');
        push @texts, localize('Your new account has been created.');
        push @texts, localize('Deposit is done. Transaction ID: [_1]');
        push @texts, localize('Withdrawal is done. Transaction ID: [_1]');
        push @texts, localize('Start trading with MT5:');
        push @texts, localize('Go to web terminal');
        push @texts, localize('Download desktop app');
        push @texts, localize('Congratulations! Your Demo Account has been created.');
        push @texts, localize('Congratulations! Your Financial Account has been created.');
        push @texts, localize('Congratulations! Your Volatility Indices Account has been created.');
        push @texts, localize('Sorry, an error occurred while processing your request.');
        push @texts, localize('Volatility Indices Account');
        push @texts, localize('Investor password cannot be same as Main password.');
        push @texts, localize('Please contact <a href="[_1]">Customer Support</a>.');
        push @texts, localize('To register an MT5 account, please [_1] to your Binary.com account <br/> Don\'t have a Binary.com account? <a href="[_2]">Create one</a> now');
        push @texts, localize('Start trading Forex and CFDs with MetaTrader 5');
        push @texts, localize('Take advantage of MT5’s advanced features and tools for a complete trading experience.');
        push @texts, localize('Login ID');
        push @texts, localize('Create a Financial Account to trade Forex on MT5.');
        push @texts, localize('Create a Volatility Indices Account to trade Volatility Indices on MT5.');
        push @texts, localize('Create a Demo Account to trade on MT5.');
        
        # strings for financial assessment
        push @texts, localize('Your settings have been updated successfully.');
        push @texts, localize('This feature is not relevant to virtual-money accounts.');
        push @texts, localize('Please select a value');
        push @texts, localize('You did not change anything.');

        my %as_hash = @texts;
        $js .= "texts_json['" . $language . "'] = " . JSON::to_json(\%as_hash) . ";\n";
    }

    return $js;
}

sub _make_nobody_dir {
    my $dir  = shift;
    if (not -d $dir) {
        mkdir $dir;
    }

    my ($login, $pass, $uid, $gid) = getpwnam("nobody");
    chown($uid, $gid, $dir);
    return;
}

sub localize {
    my $text = shift;

    my $translated = BS::localize($text, '[_1]', '[_2]', '[_3]', '[_4]');
    if ($text eq $translated) {    #Not Translated.
        return;
    }
    $text =~ s/[\s.]/_/g;
    return ($text, $translated);
}

1;
