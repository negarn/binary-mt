var MetaTraderUI = (function() {
    "use strict";

    var hiddenClass,
        errorClass,
        $form,
        isValid,
        isAuthenticated,
        hasGamingCompany,
        hasFinancialCompany,
        currency,
        highlightBalance,
        mt5Logins,
        mt5Accounts;

    var init = function() {
        MetaTraderData.initSocket();
        if(!TUser.get().hasOwnProperty('is_virtual')) {
            return; // authorize response is not received yet
        }

        hiddenClass = 'invisible';
        errorClass  = 'errorfield';
        currency    = 'USD';
        mt5Logins   = {};
        mt5Accounts = {};
        highlightBalance = false;

        Content.populate();

        MetaTraderData.requestLandingCompany();
    };

    var initOk = function() {
        findInSection('demo', '.form-new-account').contents().clone().appendTo('#section-financial .form-new-account');
        if(hasGamingCompany) {
            $('#section-financial').contents().clone().appendTo('#section-gaming');
            $('#section-gaming h3').text($('#nav-gaming a').text());
        } else {
            hideAccount('gaming');
        }
        if(!hasFinancialCompany) {
            hideAccount('financial');
        }

        MetaTraderData.requestLoginList();

        // Tab
        $('.sidebar-nav li a').click(function(e) {
            e.preventDefault();
            displayTab($(this).attr('href').substring(1));
        });

        $('#mt-container').removeClass(hiddenClass);
    };

    var notEligible = function() {
        showPageError(Content.localize().textFeatureUnavailable);
        $('mt-container').addClass(hiddenClass);
    };

    var displayAccount = function(accType) {
        findInSection(accType, '.form-new-account').addClass(hiddenClass);
        var $details = $('<div/>').append($(
            makeTextRow('Login', mt5Accounts[accType].login) +
            makeTextRow('Balance', currency + ' ' + mt5Accounts[accType].balance, 'balance') +
            makeTextRow('Name', mt5Accounts[accType].name) +
            // makeTextRow('Leverage', mt5Accounts[accType].leverage)
            makeTextRow('', text.localize('Start trading with your MetaTrader Account') +
                ' <a class="button pjaxload" href="' + page.url.url_for('download-metatrader') + '" style="margin:0 20px;">' +
                    '<span>' + text.localize('Download MetaTrader') + '</span></a>')
        ));
        findInSection(accType, '.account-details').html($details.html());

        // display deposit/withdrawal form
        var $accordion = findInSection(accType, '.accordion');
        if(/financial|gaming/.test(accType)) {
            findInSection(accType, '.msg-account, .authenticate').addClass(hiddenClass);
            if(page.client.is_virtual()) {
                $accordion.addClass(hiddenClass);
                $('.msg-switch-to-deposit').removeClass(hiddenClass);
            } else {
                $('.msg-switch-to-deposit').addClass(hiddenClass);
                ['.form-deposit', '.form-withdrawal'].map(function(formClass){
                    $form = findInSection(accType, formClass);
                    $form.find('.binary-login').text(page.client.loginid);
                    $form.find('.mt-login').text(mt5Accounts[accType].login);
                    $form.find('.txtAmount').unbind('keypress').keypress(onlyNumericOnKeypress);
                    $form.find('button').unbind('click').click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if(/deposit/.test(formClass)) {
                            depositToMTAccount(accType);
                        } else {
                            withdrawFromMTAccount(accType);
                        }
                    });
                });

                if(highlightBalance) {
                    findInSection(accType, '.balance').addClass('notice-msg').delay(5000).queue(function(){$(this).removeClass('notice-msg');});
                    highlightBalance = false;
                }

                if($accordion.hasClass(hiddenClass)) {
                    $(function() {
                        $accordion.removeClass(hiddenClass).accordion({
                            heightStyle : 'content',
                            collapsible : true,
                            active      : false
                        });
                    });
                }
            }
        }
    };

    var hideAccount = function(accType) {
        $('#nav-' + accType + ', #section-' + accType).remove();
    };

    var makeTextRow = function(label, value, className) {
        return '<div class="gr-row gr-padding-10 ' + (className || '') + '">' +
            (label ? '<div class="gr-4">' + text.localize(label) + '</div>' : '') +
            '<div class="gr-' + (label ? '8' : '12') + '">' + value + '</div></div>';
    };

    var getAccountType = function(group) {
        return group ? (/^demo/.test(group) ? 'demo' : group.split('\\')[1]) : '';
    };

    var findInSection = function(accType, selector) {
        return $('#section-' + accType).find(selector);
    };

    var createNewAccount = function(accType) {
        if(formValidate()) {
            MetaTraderData.requestSend({
                'mt5_new_account' : 1,
                'account_type'    : accType,
                'email'           : TUser.get().email,
                'name'            : /demo/.test(accType) ? $form.find('.txtName').val() : TUser.get().fullname,
                'mainPassword'    : $form.find('.txtMainPass').val(),
                'investPassword'  : $form.find('.txtInvestPass').val(),
                'leverage'        : '100' // $form.find('.ddlLeverage').val()
            });
        }
    };

    var depositToMTAccount = function(accType) {
        $form = findInSection(accType, '.form-deposit');
        if(formValidate('deposit')) {
            MetaTraderData.requestSend({
                'mt5_deposit' : 1,
                'from_binary' : page.client.loginid,
                'to_mt5'      : mt5Accounts[accType].login,
                'amount'      : $form.find('.txtAmount').val()
            });
        }
    };

    var withdrawFromMTAccount = function(accType, isPasswordChecked) {
        $form = findInSection(accType, '.form-withdrawal');
        if(formValidate('withdrawal')) {
            if(!isPasswordChecked) {
                MetaTraderData.requestPasswordCheck(mt5Accounts[accType].login, $form.find('.txtMainPass').val());
            } else {
                MetaTraderData.requestSend({
                    'mt5_withdrawal' : 1,
                    'from_mt5'       : mt5Accounts[accType].login,
                    'to_binary'      : page.client.loginid,
                    'amount'         : $form.find('.txtAmount').val()
                });
            }
        }
    };

    // --------------------------
    // ----- Tab Management -----
    // --------------------------
    var displayTab = function(tab) {
        if(!tab) {
            tab = (page.url.location.hash.substring(1) || '').toLowerCase();
            if(!tab || !/demo|financial|gaming/.test(tab)) {
                tab = 'demo';
            }
        }
        if((/financial/.test(tab) && !hasFinancialCompany) || (/gaming/.test(tab) && !hasGamingCompany)) {
            tab = 'demo';
        }

        // url
        window.location.hash = '#' + tab;

        // tab
        $('.sidebar-nav li').removeClass('selected');
        $('.sidebar-nav').find('#nav-' + tab).addClass('selected');

        // section
        $('.section').addClass(hiddenClass);
        $('#section-' + tab).removeClass(hiddenClass);
        if(/demo|financial|gaming/.test(tab)) {
            manageTabContents();
        }
    };

    var manageTabContents = function() {
        var accType = $('.sidebar-nav li.selected').attr('id').split('-')[1];
        var hasMTDemo = mt5Accounts.hasOwnProperty('demo');

        if(/demo/.test(accType)) {
            if(!hasMTDemo) {
                $form = findInSection(accType, '.form-new-account');
                $form.removeClass(hiddenClass);
                $form.find('.name-row').removeClass(hiddenClass);
                passwordMeter();
            }
        } else if(/financial|gaming/.test(accType)) {
            if(!mt5Accounts.hasOwnProperty(accType)) {
                if(page.client.is_virtual()) {
                    // check if this client has real binary account
                    var hasRealBinaryAccount = false;
                    page.user.loginid_array.map(function(loginInfo) {
                        if(loginInfo.real) hasRealBinaryAccount = true;
                    });

                    findInSection(accType, '.msg-account').html(hasRealBinaryAccount ?
                        text.localize('To create a real account for MetaTrader, switch to your [_1] real money account.', ['Binary.com']) :
                        text.localize('To create a real account for MetaTrader, <a href="[_1]">upgrade to [_2] real money account</a>.', [page.url.url_for('new_account/realws', '', true), 'Binary.com'])
                    ).removeClass(hiddenClass);
                } else {
                    if(!isAuthenticated) {
                        MetaTraderData.requestAccountStatus();
                    } else {
                        $form = findInSection(accType, '.form-new-account');
                        $form.find('.account-type').text(text.localize(accType.charAt(0).toUpperCase() + accType.slice(1)));
                        $form.find('.name-row').remove();
                        passwordMeter();
                        $form.removeClass(hiddenClass);
                    }
                }
            }
        }

        if($form && /new/.test($form.attr('class'))) {
            $form.find('button').unbind('click').click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                createNewAccount(accType);
            });
        }
    };

    // -----------------------------
    // ----- Response Handlers -----
    // -----------------------------
    var responseLandingCompany = function(response) {
        if(response.hasOwnProperty('error')) {
            return showPageError(response.error.message, true);
        }

        var lc = response.landing_company;
        hasFinancialCompany = lc.hasOwnProperty('mt_financial_company') && lc.mt_financial_company.shortcode === 'vanuatu';
        hasGamingCompany    = lc.hasOwnProperty('mt_gaming_company')    && lc.mt_gaming_company.shortcode    === 'costarica';
        if (lc.hasOwnProperty('financial_company') && lc.financial_company.shortcode === 'costarica' && (hasFinancialCompany || hasGamingCompany)) {
            initOk();
        } else {
            notEligible();
        }
    };

    var responseAccountStatus = function(response) {
        if(response.hasOwnProperty('error')) {
            return showPageError(response.error.message, false);
        }

        if($.inArray('authenticated', response.get_account_status.status) > -1) {
            isAuthenticated = true;
            manageTabContents();
        } else if(!page.client.is_virtual()) {
            $('.authenticate a').attr('href', page.url.url_for('/user/authenticatews', '', true));
            $('.authenticate').removeClass(hiddenClass);
        }
    };

    var responseLoginList = function(response) {
        if(response.hasOwnProperty('error')) {
            return showPageError(response.error.message, false);
        }

        mt5Logins   = {};
        mt5Accounts = {};
        if(response.mt5_login_list && response.mt5_login_list.length > 0) {
            response.mt5_login_list.map(function(obj) {
                var accType = getAccountType(obj.group);
                if(accType) { // ignore old accounts which are not linked to any group
                    mt5Logins[obj.login] = accType;
                    mt5Accounts[accType] = {login: obj.login};
                    MetaTraderData.requestLoginDetails(obj.login);
                }
            });
        } else {
            displayTab();
        }
    };

    var responseLoginDetails = function(response) {
        if(response.hasOwnProperty('error')) {
            return showAccountMessage(mt5Logins[response.echo_req.login], response.error.message);
        }

        var accType = getAccountType(response.mt5_get_settings.group);
        mt5Accounts[accType] = response.mt5_get_settings;
        displayTab();
        displayAccount(accType);
    };

    var responseNewAccount = function(response) {
        if(response.hasOwnProperty('error')) {
            return showFormMessage(response.error.message, false);
        }

        MetaTraderData.requestLoginDetails(response.mt5_new_account.login);
        showAccountMessage(response.mt5_new_account.account_type, text.localize('Congratulations! Your account has been created.'));
    };

    var responseDeposit = function(response) {
        $form = findInSection(mt5Logins[response.echo_req.to_mt5], '.form-deposit');
        if(response.hasOwnProperty('error')) {
            return showFormMessage(response.error.message, false);
        }

        if(+response.mt5_deposit === 1) {
            $form.find('.txtAmount').val('');
            showFormMessage(text.localize('Deposit is done. Transaction ID: [_1]', [response.binary_transaction_id]), true);
            highlightBalance = true;
            MetaTraderData.requestLoginDetails(response.echo_req.to_mt5);
        } else {
            showFormMessage('Sorry, an error occurred while processing your request.', false);
        }
    };

    var responseWithdrawal = function(response) {
        $form = findInSection(mt5Logins[response.echo_req.from_mt5], '.form-withdrawal');
        if(response.hasOwnProperty('error')) {
            return showFormMessage(response.error.message, false);
        }

        if(+response.mt5_withdrawal === 1) {
            $form.find('.txtAmount').val('');
            showFormMessage(text.localize('Withdrawal is done. Transaction ID: [_1]', [response.binary_transaction_id]), true);
            highlightBalance = true;
            MetaTraderData.requestLoginDetails(response.echo_req.from_mt5);
        } else {
            showFormMessage('Sorry, an error occurred while processing your request.', false);
        }
    };

    var responsePasswordCheck = function(response) {
        var accType = mt5Logins[response.echo_req.login];
        $form = findInSection(accType, '.form-withdrawal');
        if(response.hasOwnProperty('error')) {
            return showError('.txtMainPass', response.error.message);
        }

        if(+response.mt5_password_check === 1) {
            withdrawFromMTAccount(accType, true);
        }
    };

    // --------------------------
    // ----- Form Functions -----
    // --------------------------
    var passwordMeter = function() {
        if (isIE()) {
            $form.find('.password-meter').remove();
            return;
        }

        if($form.find('meter').length !== 0) {
            $form.find('.password').unbind('input').on('input', function() {
                $form.find('.password-meter').attr('value', testPassword($form.find('.password').val())[0]);
            });
        }
    };

    var formValidate = function(formName) {
        clearError();
        isValid = true;

        if(formName === 'deposit') { // deposit form
            var errMsgDeposit = MetaTrader.validateAmount($form.find('.txtAmount').val());
            if(errMsgDeposit) {
                showError('.txtAmount', errMsgDeposit);
                isValid = false;
            }
        } else if(formName === 'withdrawal') { // withdrawal form
            var errMsgPass = MetaTrader.validateRequired($form.find('.txtMainPass').val());
            if(errMsgPass) {
                showError('.txtMainPass', errMsgPass);
                isValid = false;
            }
            var errMsgWithdrawal = MetaTrader.validateAmount($form.find('.txtAmount').val());
            if(errMsgWithdrawal) {
                showError('.txtAmount', errMsgWithdrawal);
                isValid = false;
            }
        } else { // create new account form
            var passwords = ['.txtMainPass', '.txtInvestPass'];
            passwords.map(function(elmID){
                var errMsg = MetaTrader.validatePassword($form.find(elmID).val());
                if(errMsg) {
                    showError(elmID, errMsg);
                    isValid = false;
                }
            });
            var valuePass2 = $form.find('.txtMainPass2').val(),
                errMsgPass2 = MetaTrader.validateRequired(valuePass2);
            if(errMsgPass2) {
                showError('.txtMainPass2', errMsgPass2);
                isValid = false;
            } else if($form.find('.txtMainPass').val() !== valuePass2) {
                showError('.txtMainPass2', Content.localize().textPasswordsNotMatching);
                isValid = false;
            }
            // name
            var $nameRow = $form.find('.name-row');
            if($nameRow.length && !$nameRow.hasClass(hiddenClass)) {
                var errMsgName = MetaTrader.validateName($form.find('.txtName').val());
                if(errMsgName) {
                    showError('.txtName', errMsgName);
                    isValid = false;
                }
            }
        }

        return isValid;
    };

    var showError = function(selector, errMsg) {
        $form.find(selector).parent().append($('<p/>', {class: errorClass, text: errMsg}));
        isValid = false;
    };

    var clearError = function(selector) {
        $(selector ? selector : 'p.' + errorClass).remove();
        $('#errorMsg').html('').addClass(hiddenClass);
        $form.find('.formMessage').html('');
        $('.msg-account').addClass(hiddenClass);
    };

    var showFormMessage = function(msg, isSuccess) {
        var $elmID = $form.find('.formMessage');
        $elmID
            .attr('class', isSuccess ? 'success-msg' : errorClass)
            .html(isSuccess ? '<ul class="checked"><li>' + text.localize(msg) + '</li></ul>' : text.localize(msg))
            .css('display', 'block')
            .delay(5000)
            .fadeOut(1000);
    };

    var showPageError = function(errMsg, hideForm) {
        $('#errorMsg').html(errMsg).removeClass(hiddenClass);
        if(hideForm) {
            $form.addClass(hiddenClass);
        }
    };

    var showAccountMessage = function(accType, message) {
        findInSection(accType, '.msg-account').html(message).removeClass(hiddenClass);
    };

    return {
        init: init,
        responseLoginList      : responseLoginList,
        responseLoginDetails   : responseLoginDetails,
        responseNewAccount     : responseNewAccount,
        responseDeposit        : responseDeposit,
        responseWithdrawal     : responseWithdrawal,
        responsePasswordCheck  : responsePasswordCheck,
        responseAccountStatus  : responseAccountStatus,
        responseLandingCompany : responseLandingCompany,
    };
}());
