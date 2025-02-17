var GothamXNarrow = new FontFace('GothamXNarrow', 'url(fonts/Gotham-XNarrow-Book.woff)', {
    style: 'normal',
    weight: '100',
});
var GothamRounded = new FontFace('GothamRounded', 'url(fonts/Gotham-Rounded-Medium.woff)', {
    style: 'normal',
    weight: '100',
});
document.fonts.add(GothamXNarrow);
document.fonts.add(GothamRounded);
GothamXNarrow.load();
GothamRounded.load();
document.fonts.ready.then(() => {
    textFit(document.getElementById("hpt2"))
    textFit(document.getElementById("hpt1"))
    textFit(document.getElementById("popupHeader"))
});
