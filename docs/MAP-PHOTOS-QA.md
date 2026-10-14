> 2026-10-14写真表示更新：飲食37・宿泊26の実写真を表示。民宿弘陽荘1件は写真の施設対応を確認中。以下の未許諾／リンクのみの記述は旧版の経緯。[現行の許諾範囲・画像検証](PHOTOS-FACILITIES.md)。

# 地図・空中写真・宿泊元表（2026-10-14）

テスト公開のみ。本番 minamigoen/MinamiGo と元Sheets・共有権限・認証は変更しません。専用ローカル checkout minamigo-test を使用。既存README・docs・前回threadの最終turnを確認しました。このcheckout/workspaceには .agents、AGENTS.md、プロジェクト固有SKILL.mdやローカル記憶はありませんでした。UI/UX Pro Max の mobile map popup touch 検索で44pxの操作領域・8px間隔を採用。Google Sheets接続はmetadata確認後、列名と必要な有界範囲のみ読みました。

## 元表の読取結果

宿泊「宿泊施設一覧_フォーマット」D2:AH28を既存接続で読取。27件中26件に緯度・経度の組、27件に画像欄、ライセンス欄は全件空でした。NO16は緯度欠損。NO9とNO21は同施設・同住所のコテージ／テントサイトですが元表座標が離れており、2件のピンを保留。24件を「宿泊元表の参考座標・現地／入口／経路未検証」として表示します。座標がない3件も一覧と住所検索を利用できます。座標を入口・正確なナビ目的地と断定せず、外部経路は従来の施設名・住所検索を維持しています。

宿泊画像27件中、公開町画像20件は外部リンクだけを追加。Drive画像・フォルダ7件は公開共有の根拠がないためリンクも非掲載。元表のNOと既存公開確認記録を照合した公開情報だけを保存し、Sheet ID・管理メモ・権限情報・Drive IDを公開JSONに含めません。

飲食「飲食店一覧_フォーマット」AE2:AF60も読取。写真のURLや「変更お願いします」という記載は許諾記録ではないため、飲食・宿泊の未許諾写真は転載・直接埋込みしません。施設写真の表示に必要なのは、対象URL、著作者／権利者、PWA掲載・必要な加工の許可、クレジットまたは適用ライセンスです。

## 表示できる写真とタイル

- トップは大浜海岸の2010年1月写真を表示。施設写真と混同させません。[Wikimedia Commons原本説明](https://commons.wikimedia.org/wiki/File:%C5%8Chama_Beach_01.jpg)で著作者 na0905、タイトル Ōhama Beach 01.jpg、[CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)を確認。クレジット、原本へのリンク、ライセンスへのリンク、表示サイズ変更／トリミングを併記。外部読込失敗時は独自イラストと案内を表示。写真をPWAで一括取得／保存しません。
- 地図は[OSMタイルポリシー](https://operations.osmfoundation.org/policies/tiles/)に従い、可視出典、正式HTTPS URL、ブラウザ標準cache／Referer、表示範囲のみを取得。一括ダウンロード／SW保存なし。
- 空中写真は[国土地理院タイル一覧](https://maps.gsi.go.jp/development/ichiran.html)の seamlessphoto。リアルタイム読込は出典とリンクを明示して利用可能。[利用規約](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html)に従います。広域の衛星画像も含むため Landsat8 (GSI, TSIC, GEO Grid/AIST; USGS), GEBCO を併記。撮影時期は地点ごとに異なる旨を表示。範囲外のGRUS対象地域へは自動移動しません。表示中の背景だけを読込み、外部タイルをSWで保存しません。
- 新規有料API／キー／認証は不要。宿泊の既存 /exec URL・公開タブ／列は引き続き未確認で、元表→確認記録→公開時更新です。

## 再現手順

1. 公開テスト https://minamigoen.github.io/test-MinamiGo/ を開く。既存利用者は「更新して再読み込み」を選択。
2. 「泊まる」→「地図」。24参考ピン、27一覧項目を確認。
3. ピンを押す。美波飯マップ同様に地点を拡大して詳細を開く。参考座標・写真リンク・住所と施設案内を確認。閉じるとピンのポップアップが残る。
4. 「空中写真」→「地図」。位置・ズーム・選択を保ち、出典が切り替わる。写真は撮影時期が異なるので現況確認には施設の最新案内を使う。
5. NO9／21／16は一覧から選び住所検索を確認。写真リンク20件は外部で開く。非公開Driveリンクは含めない。
6. 320／390／768／1440px、背景・写真失敗、オフライン一覧、お気に入り・詳細履歴を確認。

開発検証: `npm test`、`npm run validate`、`npm run build`。Python Playwright + Chromium環境で `python tests/map-browser.py`、`python tests/browser.py`、`python tests/media-browser.py`、`python tests/shared-food-browser.py`、`python tests/sw-update.py`。実URLは `python tests/live-browser.py`。CIは実URLのスクリーンショットとresult.jsonを live-test-browser-evidence artifactへ保存します。ローカル背景テストではタイルをstubし、実提供元への一括アクセスをしません。
