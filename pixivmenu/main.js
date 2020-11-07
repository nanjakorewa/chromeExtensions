var bgColor = "bg-black";
chrome.storage.sync.get('useWhiteColor', function(settings) {
  if(settings.useWhiteColor) bgColor = "bg-white";
});

var listIsInline = false;
var areaType = "top";
chrome.storage.sync.get('areaType', function(settings) {
  if(settings.areaType) areaType = settings.areaType;
  listIsInline = (areaType=='top' || areaType=='bottom');
});

var showKibs = false;
var kibsType = 'hidden';
chrome.storage.sync.get('kibsType', function(settings) {
  if(settings.kibsType){
    showKibs = true;
    kibsType = settings.kibsType;
  }
});

var userId = '#';
chrome.storage.sync.get('userId', function(settings) {
  if(settings.userId){
    userId = settings.userId;
  }
});

// TODO: 機能を一旦ドロップ
// chrome.storage.sync.get('listInline', function(settings) {
//   if(settings.listInline) listIsInline = true;
// });

$(function() {
  menuNameUrlList = {
//		'ホーム': '/',
      '投稿(イラスト)': '/upload.php',
      '投稿(マンガ)': '/upload.php?type=manga',
      '投稿(小説)': '/novel/upload.php',
      '作品管理': '/manage/illusts',
      'フォロー': '/users/'+userId+'/following',
      'フォロワー': '/users/'+userId+'/followers',
      'フォロー中': '/bookmark.php?type=user',
      'ブックマーク': '/bookmark.php',
      '閲覧履歴': '/history.php',
      '設定': '/setting_user.php',
      'ランキング': '/ranking.php',
  };

  // メニュー領域のクラス設定
  ul = listIsInline ? $('<ul>', { class:'row pl-0 pr-0 '}) : $('<ul>', { class:'list-group bar-hidden'});

  // inner html
  for (let [key, value] of Object.entries(menuNameUrlList)) {
    li = listIsInline ?  $('<li>', { class:'col-sm-2 pl-0 pr-0' }) : $('<li>', { class:'list-group-item' });
    li.append('<a href="' + value + '">' + key + '</a>');
    li.addClass(bgColor);
    ul.append(li);
  }

  // uuid, 既存cssとの名前の衝突を避けるため
  var uuid = 'X46fdd55eX3d96Xa49bX3cf3X044bce140761X';
  if(listIsInline){
    div = $('<div>', { id:uuid, style:'max-height:3em;' }).append(ul);
  }
  else if(areaType=='left'){
    div = $('<div>', { id:uuid, class:'b-left'}).append(ul);
  }
  else if(areaType=='right'){
    div = $('<div>', { id:uuid, class:'b-right'}).append(ul);
  }

  // areaType設定にしたがってメニューを表示する
  if(areaType=='top'){
    div.addClass('top-menu-X46fdd55eX3d96');
  }
  else if (areaType=='right'){
    div.addClass('right-menu-X46fdd55eX3d96');
  }
  else if (areaType=='left'){
    div.addClass('left-menu-X46fdd55eX3d96');
  }
  div.prependTo('body');
});
