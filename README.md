# AIcourse
AIcourse projects
Git merge practice
GitHub CLI pull request practice

## ドキュメント

- [REQUIREMENTS.md](./REQUIREMENTS.md) — 要件定義書(プロジェクト概要・非機能要件・制約事項・将来拡張候補)
- [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md) — 機能要件・受け入れ基準・ユースケース
- [SCREEN_DESIGN.md](./SCREEN_DESIGN.md) — 画面設計
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) — データ保存方式・データ構造
- [TECH_STACK.md](./TECH_STACK.md) — 使用技術とその役割

## バックエンド(PostgreSQL + Spring Boot)の開発手順

前提: Docker Desktop が起動していること。

```powershell
docker compose up -d --wait   # PostgreSQL 16 を起動(healthy まで待つ)
cd backend
.\gradlew.bat test            # DB 接続テスト(DatabaseConnectionTest)を含む
.\gradlew.bat bootRun         # 起動(http://localhost:8080/actuator/health)
```

- **DB を先に起動すること。** `DatabaseConnectionTest` は実際に PostgreSQL へ接続するため、DB が停止中だと失敗する。
- 停止: `docker compose stop`(データは残る)。コンテナ削除: `docker compose down`(データは残る)。データごと削除: `docker compose down -v`。
- 接続確認: `docker compose exec db psql -U kanban -d kanban -c "select version();"`
- **ホスト側ポートの変更**(5432 が使用中の場合など): 環境変数 `DB_PORT` を設定する。docker compose と Spring Boot の両方が同じ変数を読むため、同じシェルで実行する。
  ```powershell
  $env:DB_PORT=5433
  docker compose up -d --wait
  cd backend; .\gradlew.bat test
  ```
- 接続情報の既定値は `kanban`(DB 名・ユーザー・パスワード)で、ローカル開発専用。`DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` で上書きできる(設定は `backend/src/main/resources/application.properties`)。
