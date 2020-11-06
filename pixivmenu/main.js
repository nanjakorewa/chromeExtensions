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
  // UUID, 既存cssとの名前の衝突を避ける
  var uuid = 'X46fdd55eX3d96Xa49bX3cf3X044bce140761X';

  // メニュー領域の追加
  divArea = $('<div>', { id:'additional-menu-X46fdd55eX3d96Xa49bX3cf3X044bce140761X' });
  for (let [key, value] of Object.entries(menuNameUrlList)) {
    divArea.append('<li><a href="' + value + '">' + key + '</a></li>');
  }
  $( "body" ).append(divArea);
});