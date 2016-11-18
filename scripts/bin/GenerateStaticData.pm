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
        push @texts, localize('To create a financial account for MetaTrader, please first complete the <a href="[_1]">Financial Assessment</a>.');
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

        # strings for financial assessment
        push @texts, localize('Your settings have been updated successfully.');
        push @texts, localize('This feature is not relevant to virtual-money accounts.');
        push @texts, localize('Please select a value');
        push @texts, localize('Financial Assessment');
        push @texts, localize('Forex trading experience');
        push @texts, localize('Forex trading frequency');
        push @texts, localize('Indices trading experience');
        push @texts, localize('Indices trading frequency');
        push @texts, localize('Commodities trading experience');
        push @texts, localize('Commodities trading frequency');
        push @texts, localize('Stocks trading experience');
        push @texts, localize('Stocks trading frequency');
        push @texts, localize('Binary options or other financial derivatives trading experience');
        push @texts, localize('Binary options or other financial derivatives trading frequency');
        push @texts, localize('Other financial instruments trading experience');
        push @texts, localize('Other financial instruments trading frequency');
        push @texts, localize('Industry of Employment');
        push @texts, localize('Level of Education');
        push @texts, localize('Income Source');
        push @texts, localize('Net Annual Income');
        push @texts, localize('Estimated Net Worth');
        push @texts, localize('0-1 year');
        push @texts, localize('1-2 years');
        push @texts, localize('Over 3 years');
        push @texts, localize('0-5 transactions in the past 12 months');
        push @texts, localize('6-10 transactions in the past 12 months');
        push @texts, localize('40 transactions or more in the past 12 months');
        push @texts, localize('Construction');
        push @texts, localize('Education');
        push @texts, localize('Finance');
        push @texts, localize('Health');
        push @texts, localize('Tourism');
        push @texts, localize('Other');
        push @texts, localize('Primary');
        push @texts, localize('Secondary');
        push @texts, localize('Tertiary');
        push @texts, localize('Salaried Employee');
        push @texts, localize('Self-Employed');
        push @texts, localize('Investments & Dividends');
        push @texts, localize('Pension');
        push @texts, localize('Less than $25,000');
        push @texts, localize('$25,000 - $100,000');
        push @texts, localize('$100,000 - $500,000');
        push @texts, localize('Over $500,001');
        push @texts, localize('Less than $100,000');
        push @texts, localize('$100,000 - $250,000');
        push @texts, localize('$250,000 - $1,000,000');
        push @texts, localize('Over $1,000,000');
        push @texts, localize('The financial trading services contained within this site are only suitable for customers who are able to bear the loss of all the money they invest and who understand and have experience of the risk involved in the acquistion of financial contracts. Transactions in financial contracts carry a high degree of risk.');
        push @texts, localize('Please complete the following financial assessment form before continuing.');
        push @texts, localize('Due to recent changes in the regulations, we are required to ask our clients to complete the following Financial Assessment. Please note that you will not be able to continue trading until this is completed.');

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
