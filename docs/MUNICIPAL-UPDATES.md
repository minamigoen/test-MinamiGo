# 写真・共有・取得差分（2026-10-15）

最新状態は107件（飲食37・宿泊26・美波遺産12・パワースポット12・観光追加20）、地図ピン93件。元シートでタスク「削除」の民宿弘陽荘は除外し、芸題踊りも引き続き除外する。過去の資料にある108件／宿泊27件／94ピンは更新前の記録。

## 写真の許諾と照合

運営者から2026-10-15、美波町との協定により町HPの観光・プロモーション写真を利用可能と明示された。町MINAMI TIMEの各モーダル見出しと画像を再照合し、観光追加19件と既存の旧八嶋電機店舗（日和佐びより）1件に町写真を表示。大浜海岸は既存のCC BY 2.0写真を維持。飲食37・宿泊26を合わせ、写真付き公開レコードは84件。撮影年月は確認できたものだけ表示する。

町写真にはページの施設アンカー、確認日、クレジット、協定に基づく許諾を表示。`municipal-photo.js` は承認済みの町ホスト・観光画像パス・画像URLと施設照合の一致を検証する。画像差し替えは自動許可しない。町以外の施設HP・観光協会・Google Maps等の写真へ許諾を拡張していない。画像障害時は代替表示となり、元画像の出典は残る。外部画像はService Workerに保存しない。

## 共有とホーム画面追加

地図と上部の「共有」からアプリURLまたは選択中の固定IDを共有。現在地、検索語、お気に入りはURLに含めない。QRは同梱のqrcode-generatorで端末内生成する。SVG保存・コピー・対応端末の共有メニューを備える。QRライブラリのMIT表記はアプリから参照できる。

ホーム画面追加は対応ブラウザのインストールイベントがある場合にボタンを表示。未対応の場合もiPhone Safari／Android／PCの手順を確認できる。キャンセルをインストール済みと表示しない。Apple用180px画像、any用192/512px、maskable用512pxを用意した。

観光協会は[美波町観光協会](https://www.minamikankou.jp/)、案内人は[町公式の観光ガイド](https://www.town.minami.lg.jp/kankou-guide/)へ直接リンクする。

## Sheetsを正本として更新する

共通12列は NO／営業所名称／営業所所在地／緯度／経度／営業所電話番号／備考／営業時間／休日／URL／SNS／画像。アプリ取込では no/name/address/lat/lng/tel/description/hours/closed/url/sns/image に対応する。NOの先頭ゼロを保持し、カテゴリを含む固定IDを維持する。新しい連携用ファイルは別担当が編集するため、この変更では触れていない。

飲食は既存の共通公開Apps Script `/exec` を読む。宿泊と観光は既存認証のコネクタで読み、審査済みJSONを生成する。新しい匿名公開API、キー、サービスアカウント、共有権限の拡張は不要。宿泊の公開 `/exec` は未確認なので作成・推測しない。連携用タブが整備されても、読み取り経路と削除除外の確認後に接続先を切り替える。

町HP更新の入口はGitHub Actions「Review municipal source changes」の手動実行、または次のコマンド。定期実行は設定していない。

```sh
python scripts/town-source.py
```

`maintenance/town-source-baseline.json` に前回取得値、`maintenance/town-source-policy.json` に固定ID・承認済み値・保護対象を分離。`staging/town-candidates.json` は差分候補のみで、公開データを変更しない。maintenanceとstagingはビルド配信物へ含めない。取得失敗、ゼロ件、大幅減少、構造異常は停止する。掲載消失は保持対象として記録し、閉業や削除と判断しない。

候補のIDを明示して `approve-town-updates.mjs <current.json> <plan.json> <approved-ids.json> <staging/draft.json>` に渡すと選択した営業時間・休日・電話・URLだけの草案を生成する。現行値が変わっていれば停止する。名称・写真・イベント開催期、個別保護項目、座標の変更は別審査が必要。草案を確認後、権限のある担当がSheetの対象セルへ反映し、再読取り・取込・検証・テスト公開を行う。アプリの公開JSONへの直接適用はしない。

Google Mapsは既存の外部リンクで開く。Places API等からの無断データ取得・蓄積はしない。[公式Maps URL仕様](https://developers.google.com/maps/documentation/urls/get-started)を使用し、[Placesの利用規定](https://developers.google.com/maps/documentation/places/web-service/policies)を別途確認する。

## 検証と再現

`npm test`、`npm run validate`、`npm run build`、既存7種のブラウザ回帰に加え、`tests/utilities-browser.py --local` で320/390/1440pxのQR・フォーカス復帰・インストールイベントを確認。独立デコードには `MINAMIGO_DECODE_QR=1` とzxing-cpp/Pillowを使用する。公開後は `tests/live-tourism.py` と `tests/utilities-browser.py` を実URLに対して実行する。

再現：トップで地図表示→地点選択→写真と出典→空中写真切替→共有で「選択中のスポット」を切替→QR保存／コピー→ホーム画面追加手順。祭りなど位置未確認の対象は一覧・詳細に残し、正確な一点を推測しない。
