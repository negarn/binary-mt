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
    foreach my $language (BS::all_languages()) {
        BS::set_lang($language);
        my @texts;

        # strings for user/settings/metatrader page
        push @texts, localize('Demo');
        push @texts, localize('Financial');
        push @texts, localize('Volatility');
        push @texts, localize('Login');
        push @texts, localize('Balance');
        push @texts, localize('Name');
        push @texts, localize('To create a real account for MetaTrader, switch to your [_1] real money account.');
        push @texts, localize('To create a real account for MetaTrader, <a href="[_1]">upgrade to [_2] real money account</a>.');
        push @texts, localize('Your new account has been created.');
        push @texts, localize('Deposit is done. Transaction ID: [_1]');
        push @texts, localize('Withdrawal is done. Transaction ID: [_1]');
        push @texts, localize('Start trading with your MetaTrader Account:');
        push @texts, localize('MetaTrader Web Platform');
        push @texts, localize('Download MetaTrader');
        push @texts, localize('Congratulations! Your account has been created.');
        push @texts, localize('Sorry, an error occurred while processing your request.');
        push @texts, localize('Volatility Indices Account');
        push @texts, localize('Investor Password cannot be same as Main Password.');
        push @texts, localize('Please contact <a href="[_1]">Customer Support</a>.');

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
