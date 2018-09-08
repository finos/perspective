var firstMove;
window.addEventListener("touchstart", function() {
  firstMove = true;
});
window.addEventListener("touchmove", function(e) {
  if (firstMove) {
    e.preventDefault();
    firstMove = false;
  }
});
