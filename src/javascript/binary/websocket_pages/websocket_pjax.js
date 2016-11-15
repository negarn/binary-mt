pjax_config_page_require_auth("user/settings/metatrader", function() {
    return {
        onLoad: function() {
            MetaTraderUI.init();
        }
    };
});

pjax_config_page_require_auth("user/settings/assessmentws", function() {
    return {
        onLoad: function() {
            FinancialAssessmentws.onLoad();
        }
    };
});
