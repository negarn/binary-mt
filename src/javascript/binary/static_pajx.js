pjax_config_page("/home", function() {
    return {
        onLoad: function() {
            $('#btn_sign_in').attr('href', Login.login_url());
            $('.link-to-binary-home').attr('href', page.url.url_for('home', '', true));
        }
    };
});

pjax_config_page("/404", function() {
    return {
        onLoad: function() {
            $('.contact a').attr('href', page.url.url_for('contact', '', true));
        }
    };
});

pjax_config_page("/terms-and-conditions", function() {
    return {
        onLoad: function() {
            var hash;
            function updateTab() {
                hash = /^#(risk|legal|order)-tab$/.test(window.location.hash) ? window.location.hash : '#legal-tab';
                //remove active class and hide all content
                $('#legal-menu li').removeClass('active a-active');
                $('.menu-has-sub-item div.toggle-content').addClass('invisible');
                //add active class to the right tab and show expected content
                $(hash).addClass('active')
                       .find('a').addClass('a-active');
                $(hash + '-content').removeClass('invisible');
            }
            $(window).on('hashchange', function() {
                updateTab();
            });
            updateTab();
            $('.content-tab-container').removeClass('invisible');
        }
    };
});

pjax_config_page("/contract-specifications", function() {
   return {
       onLoad: function() {
           var hash;
           function updateTab() {
               hash = /^#(forex|volatility|cash)-tab$/.test(window.location.hash) ? window.location.hash : '#forex-tab';
               $('#cs-menu li').removeClass('active a-active');
               $('.menu-has-sub-item div.toggle-content').addClass('invisible');
               $(hash).addClass('active')
                   .find('a').addClass('a-active');
               $(hash + '-content').removeClass('invisible');
           }
           $(window).on('hashchange', function() {
               updateTab();
           });
           updateTab();
           $('.content-tab-container').removeClass('invisible');
       }
   };
});
