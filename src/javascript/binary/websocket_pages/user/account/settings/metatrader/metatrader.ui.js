var MetaTraderUI = (function() {
    "use strict";

    var hiddenClass,
        errorClass,
        $form,
        isValid,
        isAuthenticated,
        isAssessmentDone,
        hasGamingCompany,
        hasFinancialCompany,
        currency,
        highlightBalance,
        mt5Logins,
        mt5Accounts,
        accountDisplayName = {
            volatility: 'Volatility Indices',
            financial : 'Financial',
            demo      : 'Demo',
        },
        marketDisplayName = {
            volatility: 'Volatility Indices',
            financial: 'Forex',
        };

    var init = function() {
        MetaTraderData.initSocket();
        if(!TUser.get().hasOwnProperty('is_virtual')) {
            return; // authorize response is not received yet
        }

        hiddenClass = 'invisible';
        errorClass  = 'errorfield';
        currency    = '$';
        mt5Logins   = {};
        mt5Accounts = {};
        highlightBalance = false;

        Content.populate();

        var residence = Cookies.get('residence');
        if(residence) {
            MetaTraderData.requestLandingCompany(residence);
        } else if(TUser.get().hasOwnProperty('residence')) { // get_settings response was received
            showPageError(text.localize('Sorry, an error occurred while processing your request.') + ' ' +
                text.localize('Please contact <a href="[_1]">Customer Support</a>.', [page.url.url_for('contact', '', true)]));
        }
    };

    var initOk = function() {
        clearError();
        if($('#section-financial .form-new-account').contents().length === 0) {
            findInSection('demo', '.form-new-account').contents().clone().appendTo('#section-financial .form-new-account');
            findInSection('demo', '.form-new-account .tnc-row').remove();
            if(hasGamingCompany) {
                $('#section-financial').contents().clone().appendTo('#section-volatility');
                $('#section-volatility > h3').text(text.localize('Volatility Indices Account'));
                $('#section-volatility > .authenticate').remove();
            } else {
                hideAccount('volatility');
            }
            if(!hasFinancialCompany) {
                hideAccount('financial');
            }
            $('.tnc-row').removeClass(hiddenClass).find('label').each(function() {
                $(this).click(function() { $(this).siblings('.chkTNC').click(); });
            });
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
        var mtWebURL = 'https://trade.mql5.com/trade?servers=Binary.com-Server&amp;trade_server=Binary.com-Server&amp;';
        var $details = $('<div/>').append($(
            makeTextRow('Login ID', mt5Accounts[accType].login) +
            makeTextRow('Balance', currency + ' ' + mt5Accounts[accType].balance, 'balance') +
            makeTextRow('Name', mt5Accounts[accType].name) +
            // makeTextRow('Leverage', mt5Accounts[accType].leverage)
            makeTextRow('', text.localize('Start trading with MT5:') + '<div class="download gr-padding-10">' +
                '<a class="button pjaxload" href="' + page.url.url_for('download-metatrader') + '">' +
                    '<span>' + text.localize('Download desktop app') + '</span></a>' +
                '<a class="button" href="' + (mtWebURL + 'login=' + mt5Accounts[accType].login) + '" target="_blank">' +
                    '<span>' + text.localize('Go to web terminal') + '</span></a><br />' +
                '<a href="https://download.mql5.com/cdn/mobile/mt5/ios?server=Binary.com-Server" target="_blank">' +
                    '<div class="app-store-badge"></div>' +
                '</a>' +
                '<a href="https://download.mql5.com/cdn/mobile/mt5/android?server=Binary.com-Server" target="_blank">' +
                    '<div class="google-play-badge"></div>' +
                '</a></div>')
        ));
        findInSection(accType, '.account-details').html($details.html());

        // display deposit/withdrawal form
        var $accordion = findInSection(accType, '.accordion');
        if(/financial|volatility/.test(accType)) {
            findInSection(accType, '.authenticate').addClass(hiddenClass);
            if(page.client.is_virtual()) {
                $accordion.addClass(hiddenClass);
                findInSection(accType, '.msg-switch-to-deposit').removeClass(hiddenClass);
            } else {
                findInSection(accType, '.msg-switch-to-deposit').addClass(hiddenClass);
                ['.form-deposit', '.form-withdrawal'].map(function(formClass){
                    $form = findInSection(accType, formClass);
                    $form.find('.binary-login').text(page.client.loginid);
                    $form.find('.mt-login').text(mt5Accounts[accType].login);
                    $form.find('.txtAmount').unbind('keypress').keypress(onlyNumericOnKeypress);
                    $form.find('button').unbind('click').click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!$(this).attr('disabled')) {
                            $(this).addClass('button-disabled').attr('disabled', 'disabled');
                            if(/deposit/.test(formClass)) {
                                depositToMTAccount(accType);
                            } else {
                                withdrawFromMTAccount(accType);
                            }
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

    var findInSection = function(accType, selector) {
        return $('#section-' + accType).find(selector);
    };

    var createNewAccount = function(accType) {
        if (/volatility/.test(accType.toLowerCase())) {
            accType = 'gaming';
        }
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
    var getActiveTab = function() {
        var activeTab = (page.url.location.hash.substring(1) || '').toLowerCase();
        if (!activeTab || !/demo|financial|volatility/.test(activeTab)) {
            activeTab = 'demo';
        }
        return activeTab;
    };

    var displayTab = function(tab) {
        if(!tab) {
            tab = getActiveTab();
        }
        if((/financial/.test(tab) && !hasFinancialCompany) || (/volatility/.test(tab) && !hasGamingCompany)) {
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
        if(/demo|financial|volatility/.test(tab)) {
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
            }
        } else if(/financial|volatility/.test(accType)) {
            if(!mt5Accounts.hasOwnProperty(accType)) {
                if(page.client.is_virtual()) {
                    // check if this client has real binary account
                    var hasRealBinaryAccount = false;
                    page.user.loginid_array.map(function(loginInfo) {
                        if(loginInfo.real) hasRealBinaryAccount = true;
                    });

                    findInSection(accType, '.msg-account').html(hasRealBinaryAccount ? 
                        text.localize('To create a ' + accountDisplayName[accType] + ' Account for MT5, please switch to your [_1] Real Account.', ['Binary.com']) :
                        text.localize('To create a ' + accountDisplayName[accType] + ' Account for MT5, please <a href="[_1]"> upgrade to [_2] Real Account</a>.', [page.url.url_for('new_account/realws', '', true), 'Binary.com'])
                    ).removeClass(hiddenClass);
                } else {
                    if(/financial/.test(accType) && !isAuthenticated) {
                        MetaTraderData.requestAccountStatus();
                    } else if(/financial/.test(accType) && !isAssessmentDone) {
                        MetaTraderData.requestFinancialAssessment();
                    } else {
                        $form = findInSection(accType, '.form-new-account');
                        $form.find('.account-msg').text(text.localize('Create a ' + accountDisplayName[accType] + ' Account to trade ' + marketDisplayName[accType] + ' on MT5.'));
                        $form.find('.account-type').text(text.localize(accountDisplayName[accType]));
                        $form.find('.name-row').remove();
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
            $('.authenticate').removeClass(hiddenClass);
        }
    };

    var responseFinancialAssessment = function(response) {
        if(response.hasOwnProperty('error')) {
            return showPageError(response.error.message, false);
        }

        if(objectNotEmpty(response.get_financial_assessment)) {
            isAssessmentDone = true;
            manageTabContents();
        } else if(!page.client.is_virtual()) {
            findInSection('financial', '.msg-account').html(
                text.localize('To create a Financial Account for MT5, please complete the <a href="[_1]">Financial Assessment</a>.', [page.url.url_for('user/settings/assessmentws')])
            ).removeClass(hiddenClass);
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
                var accType = MetaTrader.getAccountType(obj.group);
                if(accType) { // ignore old accounts which are not linked to any group
                    mt5Logins[obj.login] = accType;
                    mt5Accounts[accType] = {login: obj.login};
                    MetaTraderData.requestLoginDetails(obj.login);
                }
            });
        }
        if (!mt5Accounts.hasOwnProperty(getActiveTab())) {
            displayTab();
        }
    };

    var responseLoginDetails = function(response) {
        if(response.hasOwnProperty('error')) {
            showAccountMessage(mt5Logins[response.echo_req.login], response.error.message);
            if (mt5Logins[response.echo_req.login] === getActiveTab()) {
                displayTab();
            }
            return;
        }

        var accType = MetaTrader.getAccountType(response.mt5_get_settings.group);
        mt5Logins[response.mt5_get_settings.login] = accType;
        mt5Accounts[accType] = response.mt5_get_settings;
        displayTab();
        displayAccount(accType);
    };

    var responseNewAccount = function(response) {
        if(response.hasOwnProperty('error')) {
            return showFormMessage(response.error.message, false);
        }

        var new_login = response.mt5_new_account.login,
            new_type  = response.mt5_new_account.account_type;
        if (new_type === 'gaming') new_type = 'volatility';
        mt5Logins[new_login] = new_type;
        MetaTraderData.requestLoginDetails(new_login);
        showAccountMessage(new_type, text.localize('Congratulations! Your ' + accountDisplayName[new_type] + ' Account has been created.'));

        // Update mt5_logins in localStorage
        var mt5_logins = JSON.parse(page.client.get_storage_value('mt5_logins') || '{}');
        mt5_logins[new_type] = new_login;
        page.client.set_storage_value('mt5_logins', JSON.stringify(mt5_logins));

        // Push GTM
        var gtm_data = {
            'event'           : 'mt5_new_account',
            'url'             : window.location.href,
            'mt5_date_joined' : Math.floor(Date.now() / 1000),
        };
        gtm_data['mt5_' + new_type] = new_login;
        if (new_type === 'demo' && !page.client.is_virtual()) {
            var virtual_loginid;
            page.user.loginid_array.forEach(function(login) {
                if (!login.real && !login.disabled) virtual_loginid = login.id;
            });
            gtm_data['visitorId'] = virtual_loginid;
        }
        GTM.push_data_layer(gtm_data);
    };

    var responseDeposit = function(response) {
        $form = findInSection(mt5Logins[response.echo_req.to_mt5], '.form-deposit');
        enableButton($form.find('button'));
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
        enableButton($form.find('button'));
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
            enableButton($form.find('button'));
            return showError('.txtMainPass', response.error.message);
        }

        if(+response.mt5_password_check === 1) {
            withdrawFromMTAccount(accType, true);
        }
    };

    // --------------------------
    // ----- Form Functions -----
    // --------------------------
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
            var valuePass   = $form.find('.txtMainPass').val(),
                valuePass2  = $form.find('.txtMainPass2').val(),
                errMsgPass2 = MetaTrader.validateRequired(valuePass2);
            if(errMsgPass2) {
                showError('.txtMainPass2', errMsgPass2);
                isValid = false;
            } else if(valuePass !== valuePass2) {
                showError('.txtMainPass2', Content.localize().textPasswordsNotMatching);
                isValid = false;
            }
            // main & investor passwords must vary
            var valueInvestPass = $form.find('.txtInvestPass').val();
            if(valueInvestPass && valueInvestPass === valuePass) {
                showError('.txtInvestPass', text.localize('Investor password cannot be same as Main password.'));
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
            // tnc
            var $tncRow = $form.find('.tnc-row');
            if($tncRow.length && !$tncRow.hasClass(hiddenClass)) {
                if(!$form.find('.chkTNC:checked').length) {
                    showError('.chkTNC', Content.errorMessage('req'));
                    isValid = false;
                }
            }
        }

        if (!isValid) {
            enableButton($form.find('button'));
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
        if($form && $form.length) {
            $form.find('.formMessage').html('');
        }
        $('.msg-account').addClass(hiddenClass);
    };

    var showFormMessage = function(msg, isSuccess) {
        var $elmID = $form.find('.formMessage');
        $elmID
            .attr('class', (isSuccess ? 'success-msg' : errorClass) + ' formMessage')
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

    var enableButton = function($btn) {
        $btn.removeClass('button-disabled').removeAttr('disabled');
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
        responseFinancialAssessment: responseFinancialAssessment,
    };
}());
