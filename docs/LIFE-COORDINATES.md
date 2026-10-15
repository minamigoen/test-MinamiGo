# 生活施設と位置補完（2026-10-15）

全114件。生活カテゴリ9施設は新規7件と既存ID2件の横断表示で、同じ施設のカードを重複作成しない。飲食37・宿泊26と写真付き84件を維持する。地図の参考ピン116は、由岐の連続秋祭り7地区の複数ピンを含む。宿泊は26施設、観光追加は20項目の位置を表示する。

## 生活9施設

|施設／固定ID|公式出典|2026-10-15に確認した掲載内容|座標の扱い|
|---|---|---|---|
|薬王寺温泉／minamimeshi-0000000010（既存）|[薬王寺公式](https://yakuouji.net/yakuohji-spa)|温泉12–20時、火・金休。併設ランドリー13–21時。食事8–20時（入店19:30まで）、火・金休。|既存の共通元表地点を維持。温泉・食事・洗濯の時間を区別。|
|ホテル白い燈台／minamistay-0000000001（既存）|[施設公式](https://www.shiroitodai.jp/)|日帰り入浴は2026-08-05から休業。入浴は宿泊者のみ。|既存の宿泊元表地点を維持。制限をカード・一覧・詳細に表示。|
|ファミリーマート日和佐店／life-family-hiwasa|[店舗公式](https://store.family.co.jp/points/31598)|24時間。|公式ページ内の施設地点。|
|apollostation日和佐SS／life-idemitsu-hiwasa|[出光公式](https://map.idemitsu.com/b/a/info/0000008237/)|月～土7:00–19:30、日休。|GeoCoordinatesの世界測地系を採用。latitudeTky/longitudeTkyは不採用。|
|コスモ日和佐SS／life-cosmo-hiwasa|[コスモ公式](https://map.cosmo-energy.co.jp/points/S360071)|6:30–20:30、年中無休との掲載。|公式ページ内の施設地点。|
|ENEOS赤松SS／life-eneos-akamatsu|[ENEOS公式](https://eneos-ss.com/search/ss/pc/detail.php?SCODE=036184)|時間・休日は掲載確認できず、訪問前確認。|公式店舗ページの地点設定。|
|オオキタ日和佐店／life-ookita-hiwasa|[事業者公式](https://ff-ookita.jp/about.html)・[店舗公式](https://r.goope.jp/ookitahiwasa/about)|9:30–19:30、第2水休。店舗公式には8月を除く補足があり要確認。|座標は保留。公式が案内する外部地図リンクと住所検索を残す。|
|フードショップみなみ／life-foodshop-minami|[公式チェーン](https://ptl.zchain.co.jp/store/6437?store_group_id=1)|9:30–19:00、日休。|公式ページ内の店舗地点。|
|フードセンターいずみ／life-foodcenter-izumi|[公式チェーン](https://ptl.zchain.co.jp/store/6435?store_group_id=1)|9:30–18:30、日休。旧事業者HPとの差を記録し訪問前確認。|公式ページ内の店舗地点。|

表示時間は確認時点の公式掲載で、現在営業中の保証ではない。各施設の詳細に公式リンクと確認日を表示する。新規7施設の写真は許諾確認前のため転載しない。

## 位置と利用条件

新規の施設6地点は事業者自身のHTMLにある施設データを参照。Google Maps API・Places・Google地図画面からの取得・スクレイピングは行わない。Googleの外部地図リンクだけから得たオオキタの候補座標は新規保存・公開せず、独立した根拠の確認待ちとする。参考：[Maps URL](https://developers.google.com/maps/documentation/urls/get-started)、[Placesのキャッシュ・帰属要件](https://developers.google.com/maps/documentation/places/web-service/policies)。

宿泊3件と観光7項目と事業者公式1項目は、町自身が地理院地図用に公開する地点設定を照合した。`data/position-supplement-evidence.json` に出典URL・確認日・地点区分・未検証事項を記録する。

- [イザリCafe](https://www.town.minami.lg.jp/institution/shisetsu/institution71/)は町の施設代表点。町住所301-2と施設公式301-1の表記差は関連案内に残し、入口を断定しない。
- [南阿波サンラインモビレージ](https://www.town.minami.lg.jp/institution/shisetsu/institution61/)の宿泊棟とテントサイトは同じ施設代表点を使用。個別区画を推測しない。
- [桜街道](https://www.town.minami.lg.jp/docs/409.html)は道路沿線の代表点。全区間・駐車場・入口を示す一点として扱わない。
- [日和佐八幡神社秋祭り](https://www.town.minami.lg.jp/docs/800.html)と[赤松神社の花火](https://www.town.minami.lg.jp/docs/388.html)は町掲載の会場代表点。最新の動線・観覧範囲とは区別。
- [由岐の連続秋祭り](https://www.town.minami.lg.jp/docs/6203906.html)は7地区をそれぞれ表示し、同じイベント詳細へ結び付ける。単一の正確な会場として扱わない。
- 冬まつりと[うみがめまつり](https://www.awanavi.jp/archives/event/1690)は[町掲載の海岸周辺地点](https://www.town.minami.lg.jp/docs/390.html)と公式の会場範囲を照合した参考点。舞台・集合場所・次回開催を断定しない。
- [伊勢エビまつり](https://www.town.minami.lg.jp/docs/801.html)は駐車場ではなく「伊勢エビまつり会場」の地点。見出しの2026年と本文の2025年が不整合なので日付を確定表示せず、[主催者案内](https://r.goope.jp/tsci1400/info/6943672)へ誘導。

道路・複数会場・祭りの位置には経路案内を付けず、代表点と範囲の説明を表示する。すべて実測入口ではない。

## Sheets正本と手動値の保護

編集可能な既存の観光管理ファイルに `life!A1:X10` と `位置補完_20261015!A1:G12` を追加した。403となる新連携ファイル、元の飲食・宿泊・観光シート、共有権限、認証は変更しない。

lifeの先頭12列は従来と共通。続く列は固定ID・追加/既存統合・生活種別・サービス案内・制限・公式出典・座標根拠・座標区分・確認日・公開判定・自動更新保護・手動メモ。手動メモを公開JSONへ出力しない。9施設と観光21行をコネクタで読み戻し照合し、100%のGoogle表示で新規2タブの折返し・列幅を確認した。

```sh
node scripts/sync-life.mjs <life-readback.json>
node scripts/sync-stay.mjs <stay-readback.json>
node scripts/sync-sightseeing.mjs <tourism-readback.json>
npm run sync:local
node scripts/sync-food.mjs
npm test
npm run validate
npm run build
```

life取込は件数・固定ID・名称・先頭12列・座標・生活サービス・公開判定・確認日を承認記録と照合し、変更時は停止する。Sheetの編集だけで自動公開しない。薬王寺温泉の食事時間・休日は、公式出典・施設名・確認日付きの限定上書きを飲食注釈として保持し、元APIの取得値と分離する。将来の取得値に古い時間があっても手動確認値を戻さず、取得値のキャッシュは元のまま保持する。

## QAと残る保留

`tests/life.test.mjs` と `tests/life-browser.py --local` は既存ID維持、5種類のフィルタ、宿泊者限定表示、API再取得後の手動値保護、7会場の選択、公式出典・確認日、写真、QRを320/390/1440pxで確認。既存の写真・地図・オフライン・更新待機の回帰も継続する。

座標の保留は3件：オオキタと不明なパワースポット2件。人力企画は事業者公式サイト設定の所在地と座標を照合し、office/shopの代表点として補完。体験出発点・集合場所・入口ではないと明記する。既存の歴史上の位置1件は通常ピンを引き続き非表示。位置・同一性・利用根拠を確認できるまで推測しない。
