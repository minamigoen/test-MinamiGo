# 調査・設計・検証

## 既存方式の調査

本番MinamiGoはHTML1枚にTailwind CDN、Leaflet CDN、Google Fonts、Font Awesome、匿名GAS endpointを直接埋め込み、12列のSheetsデータを取得していました。公開test-MinamiGoにも本番GAS endpointと本番OGPが残っていました。元SWは外部リクエストも扱う汎用cache-firstで、CDNとデータを初期cacheに含まないため、アプリ外殻の保存だけでは完全なoffline利用を保証できません。原版のGASはallowlist型の固定12列出力ですが公開承認行の判定や入力検証がありません。

試作では本番endpoint依存を除き、ローカルLeaflet/独自CSS、確認済み公開snapshot、端末内お気に入り、scope別のversioned cacheを使用。見知らぬHTMLをデータからinnerHTMLに入れません。固定SVGだけをDOMに挿入し、すべての掲載テキストはtextContentです。

## 使用したスキルと設計判断

環境の `/workspace/.agents` は空、executor skill catalogも空でした。別案件のcardinal-systemは変更していません。公開skill catalogを独立した `/workspace/minamigo-skills` に取得し、次を読んで適用しました。

- [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): design-system検索で「local directory accessible mobile」を照合。検索主体・カテゴリ常時表示・flat design・44px以上タッチ対象・16px本文・focusリング・低motionを採用。最初のtourism検索はThai typography/scroll storytellingで不適合のため再検索。推奨欧文フォントは日本語読解とoffline要件に合わないためOS日本語フォントに調整。
- [Frontend Design](https://github.com/anthropics/skills/tree/main/skills/frontend-design): subject由来の海色・波のイラスト、一覧主体、説明の短文化、失敗/空状態に次の操作を明記。
- [Progressive Web App](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/progressive-web-app): manifest、scope、offline fallback、versioned cache、install、update lifecycleを適用。自動skipWaitingではなくユーザーの更新操作を待ちます。

カラーは深い海 `#135c64`、本文 `#173a3d`、補助文字 `#50686b`、薄い海 `#e7f2ef`、背景 `#f6f9f8`、日差し `#efc770`。主ボタン白文字のコントラストは約7.6:1。海のイラストは概念図で実景/現地写真ではありません。

## 無料枠と公開境界（2026-10-12確認）

[GitHub Pages公式制限](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): Freeはpublic repoで利用可。公開サイト1GB、soft帯域100GB/月、通常10build/時。EC/商取引や商用SaaSを主目的にする無料ホスト用途は不可。この案内試作は予約・決済を扱いません。追加月額0円を目標とし、永久無料や無制限は保証しません。

[Cloudflare公式](https://developers.cloudflare.com/pages/)は新規にはWorkersを推奨。[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)は静的配信の無料無制限を案内。将来の移行先として比較できます。Workers Builds/GitHub連携には別の無料枠があり、親側調査では3000分/月です。新アカウント・Cloudflare接続は作成していません。アプリは移行可能な通常の静的ファイルです。

[Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas): owner側手動exportでのみ使用し、利用者アクセスごとにGASを呼びません。日次quotaや実行上限はアカウント種別依存で変更可能です。所有者が手動exportする初版に追加APIキーは不要です。

[OSM tile policy](https://operations.osmfoundation.org/policies/tiles/): 正式HTTPSタイルURL、可視attribution、標準Referer、ブラウザ標準HTTP cacheに従います。一括ダウンロード/オフライン用prefetch禁止。SWは外部hostを一切扱いません。掲載可能な施設周辺座標がないときは地図タイルを要求しません。地点を今後登録した場合、Leafletは表示viewportだけを取得します。地図は提供元のbest effortで停止することがあります。

[Google Maps URLs](https://developers.google.com/maps/documentation/urls/guide): APIキー不要のMaps検索リンクを、対象の所在地を確認した施設周辺へのリンクを区別して付けます。Street Viewや経路のリンクには撮影年月と確認の限界を併記しています。Google画像/Street Viewのスクリーンショットを取得して転載していません。

## 未完了・制約

- 7件は2018計画に記載された対象で、現況・像/石そのものの正確な位置・入口・公道からの全経路・見学可否・料金・営業時間は未確認。親側でGoogle Maps掲載と2025年2月撮影Street Viewを閲覧済み。4件は施設周辺の掲載地点として区別して表示し、像や入口と断定していません。北向き地蔵の直接ナビは抑止しています。
- 7件のStreet View外部リンク、6件のMaps検索、4件の施設周辺への徒歩経路検索を組込み。恋人岬は同名誤案内を防ぐPlace IDを使用。リンク生成は公式仕様に従い、写真の転載・iframeは行いません。短縮リンク形式の再オープンと経路全区間の現地安全確認は未実施です。
- 専用の非公開Sheetsを作成し、7件入力→既存コネクタの範囲読取→公開allowlist JSON→GitHubテストブランチへ反映の一周を検証しました。共有権限は所有者のみ、管理用列とSheet IDの除外を確認。依頼時更新方式で、自動同期とテストPages配信設定は未実施です。
- Android Chrome / iPhone Safari実機でのinstall、permission、safe-areaは利用者レビューが必要です。

## 実施した検証

Node単体テスト8件、公開JSON7件のschema検証、static buildが成功。Chromium/Playwrightで320/390/768/1440pxの横overflowなし、検索・条件リセット、favorites再読込保持、詳細dialogと戻る/進む/Escape、地図/一覧、offline再読込、空/500応答、位置情報拒否、JavaScript例外なしを確認。地図テストではOSMリクエストをローカル画像で置換し、タイル提供元へ自動巡回していません。実データは4施設周辺、テストだけの座標fixtureはpublic snapshotへ含めません。

テキストcontrast計算: 白/主ボタン7.66:1、本文/背景11.60:1、補助文字/背景5.61:1。別のテストscopeで新版SWの待機→更新通知→ユーザー操作でactivate/reload→お気に入り保持を確認。初回未接続は未インストールのためブラウザ側通信エラーになり、事前接続が必要と確認しました。Android/iOS実機install、複数タブ切替は今後の実機確認です。

再現用の任意ブラウザテスト: Python + Playwright + Chromiumがある環境で `npm run build` 後、`python3 tests/browser.py` と `python3 tests/sw-update.py`。一時ディレクトリとlocalhostの一時ポートにコピーした `/test-MinamiGo/` 配下を確認し、repo内の配信ファイルは改変しません。ブラウザ検証はCIのNode単体検証とは別です。

## 2026-10-13 共通データ・宿泊更新

上記のendpoint非依存/owner手動exportは初版の構成です。現在は利用者の要望により、飲食基本情報は元アプリの既存匿名公開APIを読み、端末で10分再利用します。GAS無料quotaの範囲は保証しません。宿泊は実行時API未確認のため既存接続で元表を読み、公開根拠を照合して公開時に更新します。元repo/元Sheets/権限を変更していません。詳細はSHARED-FOOD.md/STAY.md。20件の単体検証、カード/一覧/地図のフィルタ維持・宿泊のMapsリンク、元情報の更新/追加/削除、不正更新/オフラインの直近正常保持、多タブSW更新を確認しました。公開写真0件、私的元表や画像の転載なし。
