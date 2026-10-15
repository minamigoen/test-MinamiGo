# ホスティング・料金とPC停止（2026-10-15確認）

- GitHub APIの実測：`minamigoen/test-MinamiGo` は public、Pagesは `build_type: legacy`、`main:/` を配信。公開URLは https://minamigoen.github.io/test-MinamiGo/ 。本番repoは対象外。
- 定期点検は `.github/workflows/town-source-review.yml` の `ubuntu-latest`。実行38684027040のjob APIでも `GitHub Actions` runner、同ラベルを確認。自宅PCやself-hosted runnerを使わないので、PC停止はサイト配信・定期点検を止めない。サイトは公開済みJSONを配信し、ローカル開発サーバーへ依存しない。
- 毎日21:17 UTC（翌朝06:17 JST）に候補を作り、artifactを14日保存。`contents: read`、commit/push/deployなし。直近2実行はともに手動 `workflow_dispatch` 成功であり、自然 `schedule` 起動はまだ確認できていない。
- 公開repoのGitHub Pagesと標準GitHub-hosted runner実行時間は無料対象。有料API・キー・大型runner・有料契約は追加していない。料金設定・自動書込権限も変更していない。
- artifact保管はプラン共通の枠がある。確認時の当repo active artifact合計126,732,704 bytes（143件・約120.9 MiB、API全ページ集計）。アカウント全体の他repo/Packages使用量、月中累積使用量、契約・請求額は未確認なので、請求0円の保証ではない。既存保持期間は点検候補14日、QA/preview7日。
- GitHubや外部の地図・写真・データ提供元が停止すれば該当機能に影響する。定期処理は混雑で遅延・省略の可能性、公開repoでは60日活動がないとscheduleが停止するGitHub仕様がある。PC稼働とは別の条件。

公式根拠（確認日上記）：

- [Pagesの利用可能プラン](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Actions料金・無料runnerとartifact容量](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [scheduleの遅延・無活動停止](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

この確認は設定の読取りのみ。支払方法、予算、契約、公開区分、権限、元Sheetやプライバシー草案は変更していない。
