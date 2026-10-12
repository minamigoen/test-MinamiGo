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

## 変更を取り消す

公開JSONとアプリを含む前回正常commitへ戻し、Service Workerのバージョンを新しい値に変えて再配信します。古いcache名を再利用しないでください。ブラウザのローカルお気に入りはIDに結びつくため、同じスポットのIDを不用意に変更しないでください。

## 無料運用の拡張

現在は所有者が出力・確認・commitする安全なsnapshot方式です。Sheets編集から自動pushする定期同期は未設定です。将来の自動化には最小権限の既存認証と承認済み公開データの境界を確定してから追加します。元Sheetsの「ウェブに公開」、匿名GAS endpoint、ブラウザ内のAPIキーやGitHub tokenを使わないでください。
