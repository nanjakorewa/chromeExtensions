var bgColor = "bg-black";
chrome.storage.sync.get('useWhiteColor', function(settings) {
  if(settings.useWhiteColor) bgColor = "bg-white";
});

var listIsInline = false;
chrome.storage.sync.get('listInline', function(settings) {
  if(settings.listInline) listIsInline = true;
});

var areaType = "top";
chrome.storage.sync.get('areaType', function(settings) {
  if(settings.areaType) areaType = settings.areaType;
});

$(function() {
  menuNameUrlList = {
//		"ホーム": "/",
      "作品投稿イラスト": "/upload.php",
      "うごイラ": "/ugoira_upload.php",
      "作品投稿マンガ": "/upload.php?type=manga",
      "作品投稿小説": "/novel/upload.php",
      "作品管理": "/manage/illusts",
//		"フォロー": "/users/[id]/following",
//		"フォロワー": "/users/[id]/followers",
    "フォロー中": "/bookmark.php?type=user",
    "ブックマーク": "/bookmark.php",
//		"閲覧履歴": "/history.php",
//		"しおり": "/novel/marker_all.php",
//		"設定": "/setting_user.php",
//		"イラスト・漫画": "/",
//		"小説": "/novel",
//		"フォロー新着": "/bookmark_new_illust.php",
//		"ディスカバリー": "/discovery",
//		"ランキング": "/ranking.php",
  };

  // メニュー領域のクラス設定
  ul = listIsInline ? $('<ul>', { class:'list-inline'}) : $('<ul>', { class:'list-group'});

  // inner html
  for (let [key, value] of Object.entries(menuNameUrlList)) {
    li = listIsInline ?  $('<li>', { class:'list-inline-item' }) : $('<li>', { class:'list-group-item' });
    li.append('<a href="' + value + '">' + key + '</a>');
    ul.append(li);
  }

  // uuid, 既存cssとの名前の衝突を避けるため
  var uuid = 'X46fdd55eX3d96Xa49bX3cf3X044bce140761X';
  div = $('<div>', { id:uuid }).append(ul);
  div.addClass(bgColor);

  // areaType設定にしたがってメニューを表示する
  if(areaType=='top'){
    div.addClass('top-menu-X46fdd55eX3d96');
    div.prependTo('body');
  }
  else if (areaType=='right'){
    $('#root').prepend(div);
  }
  else if (areaType=='bottom'){
    div.addClass('bottom-menu-X46fdd55eX3d96');
    $('#root').prepend(div);
  }
  else if (areaType=='top'){
    $('#root').prepend(div);
  }
  window.alert(areaType);
});