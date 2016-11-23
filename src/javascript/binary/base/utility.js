//////////////////////////////////////////////////////////////////
// Purpose: Write loading image to a container for ajax request
// Parameters:
// 1) container - a jQuery object
//////////////////////////////////////////////////////////////////
function showLoadingImage(container) {
    container.empty().append('<div class="barspinner dark"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>');
}

function showLocalTimeOnHover(s) {
    var selector = s || '.date';

    $(selector).each(function(idx, ele) {
        var gmtTimeStr = ele.innerHTML.replace('\n', ' ');

        var localTime = moment.utc(gmtTimeStr, 'YYYY-MM-DD HH:mm:ss').local();
        if (!localTime.isValid()) {
            return;
        }

        var localTimeStr = localTime.format('YYYY-MM-DD HH:mm:ss Z');

        $(ele).attr('data-balloon', localTimeStr);
    });
}

function template(string, content) {
    return string.replace(/\[_(\d+)\]/g, function(s, index) {
        return content[(+index) - 1];
    });
}

function objectNotEmpty(obj) {
    if (obj && obj instanceof Object) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) return true;
        }
    }
    return false;
}

function parseLoginIDList(string) {
    if (!string) return [];
    return string.split('+').sort().map(function(str) {
        var items = str.split(':');
        var id = items[0];
        return {
            id:        id,
            real:      items[1] === 'R',
            disabled:  items[2] === 'D',
            financial: /^MF/.test(id),
            non_financial: /^MLT/.test(id),
        };
    });
}

//used temporarily for mocha test
if (typeof module !== 'undefined') {
    module.exports = {
        template: template,
        parseLoginIDList: parseLoginIDList,
        objectNotEmpty: objectNotEmpty,
    };
}
