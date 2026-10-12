# テスト配信の読み取り確認と手順（2026-10-12）

## 確認できたこと

GitHub RESTのrepo応答を既存接続で読み、`private=false`、`has_pages=true`、`default_branch=main`、`homepage=null`、接続者のrepo権限 `admin/maintain/push=true` を確認しました。`main` のSHAは `000cd52cb131305a709791f7f6fa4eee5cba97de` で変更していません。試作ソースは `test/pwa-review-20261012`、draft PR #1です。

`has_pages=true` はPagesが設定されていることを示しますが、公開URLの現在の応答、配信sourceのbranch/folder、custom domain、環境保護ルールは確認できていません。cloud環境のPages REST読み取りは403 Forbidden、GitHubコネクタの `/pages` と `/deployments` はendpoint allowlist外でした。候補公開URLのcloud GETはnetwork proxyで403、Web読取ツールでもアクセス不可でした。404や未設定を確認したわけではありません。これは自動承認レビューの却下ではなく、読み取り経路の制約です。

Actions履歴は取得でき、現在返る4件は試作のValidate public snapshotのみで全件成功。Pagesの過去build履歴は返りませんでした。古いrunが保持期間外の可能性もあるため、Pagesのsourceをmain/rootと断定しません。

## 公開前に必要な読み取り・判断

repo管理者が [Settings → Pages](https://github.com/minamigoen/test-MinamiGo/settings/pages) で現在のSource/branch/folder、Visit site URL/custom domain、直近deployを確認します。設定変更はまだ行っていません。新たなOAuthやAPIキーは不要です。

- 既存テストサイトの内容を切り替えてよい場合: Sourceが「Deploy from a branch」であれば、試作ブランチの `/ (root)` を配信対象に選択できます。mainのコードは変えませんが、既存テストURLの表示内容は置き換わるため、その範囲を了承してからSaveしてください。
- 既存テスト表示も残す場合: 現在の公開内容をrootに保つ専用配信ブランチに、build結果 `dist/` を `review/` 配下として追加し、専用配信ブランチrootをsourceにする方式を準備します。候補は `/test-MinamiGo/review/` です。これはまだ作成/配信しておらず、完成URLではありません。新しいSWのscopeはreview配下となり、本番と旧testを上書きしません。
- SourceがGitHub Actionsの場合:現在の既存deploy workflowを確認したうえで変更案を作成します。deploy workflowには `pages:write`、`id-token:write`、`github-pages` environment、`actions/upload-pages-artifact` と `actions/deploy-pages` が必要です。environmentの許可branch/reviewerルールを確認してから実行します。現在のcheck workflowは検証artifact作成だけでdeployしません。

既存Sourceを読み取れないまま切替・環境ルール変更・mainマージをしないでください。[GitHub公式の配信source設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)に従い、管理者またはmaintainerが操作します。

公開後は実際のHTTPS URLでmanifest/SW scope、初回load、offline reload、更新通知、外部Mapsリンク、iOS/Android installを確認し、その実URLだけを完成テストURLとして案内します。
