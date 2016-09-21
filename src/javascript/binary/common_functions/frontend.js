// returns true if internet explorer browser
function isIE() {
  return /(msie|trident|edge)/i.test(window.navigator.userAgent) && !window.opera;
}

function addComma(num){
    num = (num || 0) * 1;
    return num.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
