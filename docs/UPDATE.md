# Sheetsを使った更新手順

管理元は非公開のGoogleスプレッドシートです。編集する `spots` タブと、一般公開するJSONを分離します。元資料全文、連絡先、未許諾画像、個人情報、作業メモを公開リポジトリへ保存しないでください。

## 列

公開列のallowlist: `id,name,category,description,address,lat,lng,hours,closed,price,tel,url,source,verifiedAt,accessNote,imageryDate,streetViewUrl,mapQuery,mapPlaceId,locationLabel,mapScope,directionsMode`。IDは半角小文字・数字・ハイフン、カテゴリは `nature/culture/food/shop/experience/stay/other`。不明な料金・時間は空欄、UIが「要確認」と表示します。出典と資料内容の確認日 `YYYY-MM-DD` が必須です。`verifiedAt` は現況確認の証明ではありません。

管理専用列: `publicApproved`（チェックボックス）、`locationVerified`（チェックボックス）、`currentStatusVerifiedAt`（現況確認日）、`imageRights`（画像権利）、`privateNotes`。これらはJSONへ出力しません。座標は対象を確認し（施設周辺の場合は `mapScope=surroundings` と `locationLabel` で像/入口が未確認と明記） `locationVerified=TRUE` にした場合だけ出力します。写真列は初版では出力しません。

## 公開データを出力

1. 所有者が非公開Sheetsの「拡張機能 → Apps Script」で `scripts/SheetsExport.gs` を貼り付けます。これは将来の所有者操作手順です。この試作で新OAuthや権限追加は実施していません。初回実行に所有者の既存Google認証/承認が必要なら、その場で確認してください。ウェブアプリとして公開デプロイしないでください。
2. Sheetsを再度開き「MinamiGo 公開データ → 承認済み行をJSON表示」。TRUEの行だけ出力します。公開候補を読み、JSONを保存します。
3. 管理端末/クラウド環境の公開repo外に保存したJSONを指定します。例: `node scripts/import-data.mjs /tmp/approved-export.json`（プロジェクトルートで実行）。非公開行/未知列を除外し、URL・ID・重複・座標・必須情報を検証します。問題があると終了コード1で停止し、前回正常 `data/spots.json` は維持されます。元JSONをcommitしないでください。
4. `npm test && npm run validate && npm run build` を実行。`git diff -- data/spots.json` で公開内容をレビューし、テストブランチにcommit/PRを作ります。
5. レビュー後、テストサイトの配信担当が公開します。本番とは別に扱います。公開データ更新とコード更新に合わせ `sw.js` のバージョン末尾を変更します。利用者は更新通知を選ぶと新しいアプリへ切り替わります。

Apps Scriptを使いたくない場合は `{"rows":[...]}` の管理JSONを作成し、各行に `publicApproved:true` を付けて同じimportコマンドを使えます。配信するJSON形式は `{"schemaVersion":1,"updatedAt":"ISO日時","spots":[...]}` です。

## 必要な操作・権限とコネクタによる代替

GASを使う場合は、対象シートを編集できる管理者/編集者が、そのシートに紐づくApps Scriptにコードを保存し、シートを開き直してメニューからexportを実行します。所有者本人だけに限定される操作ではありません。初回実行は実行者の認可状態をGoogleが確認します。`@OnlyCurrentDoc` により対象の現在のスプレッドシートに限定し、Sheetsの `https://www.googleapis.com/auth/spreadsheets.currentonly` と、HTML確認ダイアログの `https://www.googleapis.com/auth/script.container.ui` が関係します。Drive全体・Gmail・外部HTTP・GitHub権限はこのスクリプトのために要求しません。実際の同意画面を確認し、既存プロジェクトに他のコードがある場合はそちらが追加scopeを要求する可能性があります。この試作でOAuth認可や公開デプロイは実施していません。

現在のGoogle Drive/Sheetsコネクタは範囲の取得・作成・編集が可能です。対象の非公開管理Sheet URL/IDと公開承認行が確定すれば、既存の認証で範囲を取得→allowlist/入力検証→JSONsnapshot→GitHubテストブランチcommitの操作に代替できます。**GASの所有者実行は必須ではありません。** 一方、Apps Scriptプロジェクト作成・コード編集・カスタムメニュー実行のツールは、このセッションのコネクタに公開されていません。GAS方式をそのまま有効化する操作だけはシート側の編集者操作が必要です。今回のアプリ専用の新規テスト管理Sheetを既存アカウントの非公開ChatGPTフォルダに作成し、公開情報7件を入力しました。所有者以外の共有権限はなく、共有設定を変更していません。編集URLは管理者向け会話で渡し、公開repoやアプリに管理SheetのIDを埋め込みません。既存コネクタでこのSheetのspots!A1:AA8をUNFORMATTED_VALUEとして再取得し、公開JSONへ変換して7件が前回確認済み内容と一致することを検証済みです。新OAuth・GAS作成・トリガー設定は不要でした。

公式: [Apps Script認可](https://developers.google.com/apps-script/guides/services/authorization)、[SpreadsheetAppのscope](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app)、[UIダイアログのscope](https://developers.google.com/apps-script/reference/base/ui)。

## 変更を取り消す

公開JSONとアプリを含む前回正常commitへ戻し、Service Workerのバージョンを新しい値に変えて再配信します。古いcache名を再利用しないでください。ブラウザのローカルお気に入りはIDに結びつくため、同じスポットのIDを不用意に変更しないでください。

## 無料運用の拡張

現在は所有者が出力・確認・commitする安全なsnapshot方式です。Sheets編集から自動pushする定期同期は未設定です。将来の自動化には最小権限の既存認証と承認済み公開データの境界を確定してから追加します。元Sheetsの「ウェブに公開」、匿名GAS endpoint、ブラウザ内のAPIキーやGitHub tokenを使わないでください。

## 既存コネクタを使う実証済み更新フロー

1. 非公開の管理Sheetの `spots` で名称・説明・出典・料金などを編集します。公開してよい行は `publicApproved` をTRUEにします。施設周辺の掲載地点と現況確認を区別し、画像権利や私有地情報を確認してください。
2. 「この管理Sheetを読み、テストアプリの公開JSONを更新して」と依頼します。既存Google Sheets接続でmetadataを確認し、公開候補を含む必要範囲（初版は `spots!A1:AA8`）を `UNFORMATTED_VALUE` で読み取ります。管理Sheet自体はウェブ公開しません。
3. 取得した `values` 応答をrepo外の非公開一時ファイルに保存し、プロジェクトルートで次を実行します。`node scripts/sheets-range-to-json.mjs /tmp/private-range.json > /tmp/public-snapshot.json`。これは承認行だけを選び、22列の公開allowlist、座標/経路の確認フラグ、入力検証を適用します。管理メモ・画像権利・現況確認日・承認フラグ・Spreadsheet IDは出力しません。
4. `node scripts/import-data.mjs /tmp/public-snapshot.json`。不正データでは前回正常版を維持します。`npm test` と `npm run validate` と `npm run build` を実行し、差分の公開内容を確認します。
5. 公開JSONだけをGitHubテストブランチへcommit/pushし、draft PRをレビューします。初版で一周を実行済みです。現在は依頼時の更新フローで、Sheetの編集直後の自動同期は設定していません。公開サイトへのdeployも別手順です。

実証結果: 実Sheetの7件と確認済みpublic snapshotが内容一致。管理用5列とSheet IDが公開JSONに含まれないことを機械検証。承認されていない行は除外され、未確認位置は座標と徒歩経路を出力しないテストも成功しました。

## 写真・飲食店の拡張

[写真/リンク/飲食店の追加手順と権利条件](PHOTOS-FOOD.md)を参照してください。現在の管理範囲は `spots!A1:AJ14`（36列/13件）。写真URL/alt/出典/利用条件/クレジット、関連リンクJSON、料理種類、公式情報確認日、photoApprovedを追加しました。写真はphotoApproved=TRUEの場合だけ出力し、権利未確認の町/店舗写真は現在すべて未掲載です。新列を追加してもGoogle OAuth/共有設定は変更しません。
