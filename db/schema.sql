-- タスク管理ボード: PostgreSQL テーブル定義
-- 実行は手動で行う(自動実行はしない)。
-- 既に cards テーブルがある状態で再実行するとエラーになる(上書きはしない)。

-- カード1枚 = 1行
CREATE TABLE cards (
    -- カードを区別する番号。自動で 1, 2, 3... と振られる(主キー)
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- タイトル。空・空白だけは登録できない(文字数の上限は設けない)
    title       TEXT        NOT NULL CHECK (btrim(title) <> ''),

    -- 所属する列。todo / doing / done のいずれかだけ
    list_id     VARCHAR(10) NOT NULL CHECK (list_id IN ('todo', 'doing', 'done')),

    -- 期限(日付のみ)。NULL は「期限なし」
    due_date    DATE,

    -- 同じ列の中での表示順。0 から始まる連番(小さいほど上)
    position    INTEGER     NOT NULL CHECK (position >= 0),

    -- 作成日時・更新日時(何も指定しなければ、登録した時刻が入る)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 「ある列のカードを、表示順に取り出す」処理を速くするための索引
CREATE INDEX idx_cards_list_position ON cards (list_id, position);
