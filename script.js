// =====================================================
// タスク管理ボード
//
// 【ステップ6で作りが変わった点】
// これまでは「画面(HTML)そのもの」を直接いじっていました。
// 保存するには「カードの情報」をデータとして持つ必要があるので、
//   1. カードのデータ(cards)を配列で持つ
//   2. データを変更する(追加・編集・削除・移動)
//   3. 保存する(save)
//   4. データをもとに画面を描き直す(render)
// という流れに整理しました。画面の見た目と使い方は変わりません。
// =====================================================

// ----- 列の定義(左から順番) -----
// id は HTML の data-list と対応している。この順番が「左→右」の並び。
const LIST_IDS = ["todo", "doing", "done"];

// ----- 保存に使う名前(localStorageの「引き出しのラベル」) -----
const STORAGE_KEY = "kanban-cards";

// ----- 初回起動時だけ表示するサンプルカード -----
function createSampleCards() {
  return [
    { id: createId(), title: "サンプル: レポートを書く", list: "todo", dueDate: null },
    { id: createId(), title: "サンプル: 買い物に行く", list: "todo", dueDate: null },
    { id: createId(), title: "サンプル: 課題を進める", list: "doing", dueDate: null },
    { id: createId(), title: "サンプル: 要件定義を作る", list: "done", dueDate: null },
  ];
}

// =====================================================
// 期限(ステップ7後半で追加)
//
// 期限は "2026-11-20" のような「年-月-日」の文字列で持つ。
// 期限なしは null。この形式は文字列のまま大小比較できる
// ("2026-11-01" < "2026-11-20" が正しく成り立つ)ので扱いやすい。
// =====================================================

// "YYYY-MM-DD" の形になっているか確認する
function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// 今日の日付を "YYYY-MM-DD" で返す(パソコンの現在の日付を使う)
function getToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// 期限切れか判定する
//   ・期限が設定されている
//   ・今日より前の日付(今日が期限の場合は、まだ期限切れではない)
//   ・「完了」の列のカードは期限切れとして扱わない
function isOverdue(card) {
  return card.dueDate !== null && card.list !== "done" && card.dueDate < getToday();
}

// ----- 一意のID(他のカードと絶対にかぶらない文字列)を作る -----
// 現在時刻 + ランダムな文字を組み合わせて作る
function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// =====================================================
// 保存と読み込み(localStorage)
//
// localStorage = ブラウザの中にある小さな保存場所。
//   ・ブラウザを更新しても、閉じても、データが残る
//   ・「ラベル(キー)」と「文字列」のセットで保存する
//   ・文字列しか保存できない
//
// カードの配列は文字列ではないので、変換が必要。
//   JSON.stringify ... 配列やオブジェクト → 文字列(保存するとき)
//   JSON.parse     ... 文字列 → 配列やオブジェクト(読み込むとき)
// =====================================================

function saveCards() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    // 保存できない環境(容量不足・保存禁止など)でもアプリは動かし続ける
    console.error("保存に失敗しました:", error);
  }
}

// 保存データを読み込む。
//   ・保存データがない(初回)      → null を返す
//   ・保存データがある            → カードの配列を返す(空の配列 [] もそのまま返す)
//   ・データが壊れている          → null を返す(初回と同じ扱い)
function loadCards() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      return null; // 一度も保存していない
    }
    const parsed = JSON.parse(saved);

    // 配列でなければ壊れたデータとみなす
    if (!Array.isArray(parsed)) {
      return null;
    }

    // 正しい形のカードだけを残す(id・title・list が揃っていて、列名が正しい)
    return parsed
      .filter(function (card) {
        return (
          card &&
          typeof card.id === "string" &&
          typeof card.title === "string" &&
          LIST_IDS.includes(card.list)
        );
      })
      .map(function (card) {
        // 【ステップ7後半で追加】
        // 期限を持たない古い保存データでも、期限なし(null)として読み込める。
        // 期限の形式が正しくないものも、期限なしにする。
        return {
          id: card.id,
          title: card.title,
          list: card.list,
          dueDate: isValidDate(card.dueDate) ? card.dueDate : null,
        };
      });
  } catch (error) {
    console.error("読み込みに失敗しました:", error);
    return null;
  }
}

// =====================================================
// アプリのデータ
// =====================================================

// 保存データを優先する。なければ(初回なら)サンプルカードを使う。
// 注意: 「すべて削除して空 []」の状態は保存データとして有効なので、
//       null かどうかで判定している(空かどうかでは判定しない)。
const loaded = loadCards();
let cards = loaded !== null ? loaded : createSampleCards();

// ボード全体の要素(クリック・ドラッグ・日付変更の見張りに使う)。
// これらの処理より前に作っておく必要があるので、ここで1回だけ定義する。
const boardElement = document.querySelector(".board");

// =====================================================
// 画面の描き直し(render)
// =====================================================

// 1枚分のカードのHTML部品を作る
function createCardElement(card) {
  const element = document.createElement("article");
  element.className = "card";
  element.dataset.id = card.id; // どのカードか分かるようにIDを持たせる
  element.draggable = true; // 【ステップ7で追加】マウスでつかんで動かせるようにする

  const title = document.createElement("p");
  title.className = "card-title";
  title.textContent = card.title; // 文字は textContent で入れる(安全)
  element.appendChild(title);

  // 【ステップ7後半で追加】期限の行: 「期限 [日付] [×] 期限切れ」
  const due = document.createElement("div");
  due.className = "card-due";

  const dueLabel = document.createElement("span");
  dueLabel.className = "due-label";
  dueLabel.textContent = "期限";

  const dueInput = document.createElement("input");
  dueInput.type = "date";
  dueInput.className = "due-input";
  dueInput.value = card.dueDate || ""; // 期限なしなら空欄

  const dueClear = document.createElement("button");
  dueClear.type = "button";
  dueClear.className = "due-clear-button";
  dueClear.textContent = "×";
  dueClear.title = "期限を削除";
  dueClear.hidden = card.dueDate === null; // 期限がないときは表示しない

  const dueStatus = document.createElement("span");
  dueStatus.className = "due-status";

  due.appendChild(dueLabel);
  due.appendChild(dueInput);
  due.appendChild(dueClear);
  due.appendChild(dueStatus);
  element.appendChild(due);

  applyOverdue(element, card); // 期限切れなら赤くする

  const index = LIST_IDS.indexOf(card.list);

  const buttons = document.createElement("div");
  buttons.className = "card-buttons";
  buttons.appendChild(createButton("move-left-button", "←", "左の列へ移動", index === 0));
  buttons.appendChild(
    createButton("move-right-button", "→", "右の列へ移動", index === LIST_IDS.length - 1)
  );
  buttons.appendChild(createButton("edit-button", "編集", "", false));
  buttons.appendChild(createButton("delete-button", "削除", "", false));
  element.appendChild(buttons);

  return element;
}

// 期限切れなら、カードに "overdue" という名前を付けて「期限切れ」と表示する。
// 赤色などの見た目は、CSSが "overdue" を見て付ける。
function applyOverdue(cardElement, card) {
  const overdue = isOverdue(card);
  cardElement.classList.toggle("overdue", overdue);
  cardElement.querySelector(".due-status").textContent = overdue ? "期限切れ" : "";
}

// ボタン1個を作る小さな関数
function createButton(className, text, title, disabled) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  if (title) {
    button.title = title;
  }
  button.disabled = disabled; // 一番左の「←」、一番右の「→」は押せなくする
  return button;
}

// cards(データ)をもとに、3列すべてのカードを描き直す
function render() {
  LIST_IDS.forEach(function (listId) {
    const area = document.querySelector('.list[data-list="' + listId + '"] .cards');
    area.innerHTML = ""; // いったん空にする
    cards
      .filter(function (card) {
        return card.list === listId;
      })
      .forEach(function (card) {
        area.appendChild(createCardElement(card));
      });
  });
}

// データを変更したあとに必ず呼ぶ: 保存 → 画面更新
function update() {
  saveCards();
  render();
}

// =====================================================
// カード追加(ステップ3の機能)
// =====================================================
document.querySelectorAll(".add-form").forEach(function (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // ページの再読み込みを止める

    const input = form.querySelector(".add-input");
    const title = input.value.trim();
    if (title === "") {
      return; // 空のタイトルは追加しない
    }

    // 押された列の名前(todo / doing / done)を取得
    const listId = form.closest(".list").dataset.list;

    // 【ステップ7後半で追加】期限の入力欄の値。未入力なら "" になるので null(期限なし)にする
    const dueInput = form.querySelector(".add-due-input");
    const dueDate = isValidDate(dueInput.value) ? dueInput.value : null;

    // 新しいカードのデータを作って配列に追加
    cards.push({ id: createId(), title: title, list: listId, dueDate: dueDate });

    input.value = "";
    dueInput.value = "";
    update();
  });
});

// =====================================================
// 移動・編集・削除(ステップ4・5の機能)
// ボタンは後から増えるので、ボード全体でクリックを見張る(イベント委譲)
// =====================================================
document.querySelector(".board").addEventListener("click", function (event) {
  const cardElement = event.target.closest(".card");
  if (!cardElement) {
    return;
  }

  // 画面のカードから ID を取り出し、データの中から同じIDのカードを探す
  const card = cards.find(function (c) {
    return c.id === cardElement.dataset.id;
  });
  if (!card) {
    return;
  }

  // --- 移動 ---
  if (event.target.closest(".move-left-button")) {
    moveCard(card, -1);
  } else if (event.target.closest(".move-right-button")) {
    moveCard(card, 1);
  }

  // --- 編集 ---
  if (event.target.closest(".edit-button")) {
    const newTitle = prompt("新しいタイトルを入力してください", card.title);
    // キャンセル(null)・空欄のときは変更しない
    if (newTitle !== null && newTitle.trim() !== "") {
      card.title = newTitle.trim();
      update();
    }
  }

  // --- 削除 ---
  if (event.target.closest(".delete-button")) {
    const ok = confirm("「" + card.title + "」を削除しますか?");
    if (ok) {
      // このIDのカードを除いた新しい配列にする
      cards = cards.filter(function (c) {
        return c.id !== card.id;
      });
      update();
    }
  }
});

// --- 期限の変更(ステップ7後半で追加) ---
// 日付入力欄の値が変わったとき(設定・変更・入力欄からの削除)。
// 日付は年・月・日を打つ途中でも変更イベントが起きるため、
// 画面全体の描き直しはせず(入力中に欄が消えてしまうため)、
// データの更新・保存と、このカードの赤色表示だけを更新する。
boardElement.addEventListener("change", function (event) {
  if (!event.target.matches(".due-input")) {
    return;
  }
  const cardElement = event.target.closest(".card");
  const card = cards.find(function (c) {
    return c.id === cardElement.dataset.id;
  });
  if (!card) {
    return;
  }
  card.dueDate = isValidDate(event.target.value) ? event.target.value : null;
  cardElement.querySelector(".due-clear-button").hidden = card.dueDate === null;
  saveCards();
  applyOverdue(cardElement, card);
});

// 「×」ボタン: 期限を削除する
boardElement.addEventListener("click", function (event) {
  if (!event.target.matches(".due-clear-button")) {
    return;
  }
  const card = cards.find(function (c) {
    return c.id === event.target.closest(".card").dataset.id;
  });
  if (card) {
    card.dueDate = null;
    update();
  }
});

// カードを左(-1)・右(+1)の列へ動かす
function moveCard(card, direction) {
  const newIndex = LIST_IDS.indexOf(card.list) + direction;
  if (newIndex < 0 || newIndex >= LIST_IDS.length) {
    return; // 行き先がなければ何もしない
  }
  card.list = LIST_IDS[newIndex];
  update();
}

// =====================================================
// ドラッグ&ドロップ(ステップ7で追加)
//
// ブラウザには、ドラッグ操作用のイベントが最初から用意されている。
//   dragstart ... カードをつかんで動かし始めた
//   dragover  ... 列の上でカードを動かしている最中
//   drop      ... 列の上でマウスを離した
//   dragend   ... ドラッグが終わった(成功しても、失敗しても)
// カードに draggable = true を付けると、つかめるようになる。
// =====================================================

// 今ドラッグしているカードのID(ドラッグしていないときは null)
let draggedId = null;

// 列の強調表示(ドロップできる場所が分かる)をすべて消す
function clearDragOver() {
  document.querySelectorAll(".list.drag-over").forEach(function (list) {
    list.classList.remove("drag-over");
  });
  clearDropIndicator(); // 挿入位置の線も消す
}

// ----- 挿入位置(並べ替え)の処理 -----

// 挿入位置の線をすべて消す
function clearDropIndicator() {
  document
    .querySelectorAll(".card.drop-before, .cards.drop-end")
    .forEach(function (element) {
      element.classList.remove("drop-before", "drop-end");
    });
}

// マウスの縦位置(y)から、列の中で「どのカードの前に入るか」を決める。
//   ・ドラッグ中のカード自身は、比べる対象に入れない
//   ・カードの中央より上にある最初のカード → そのカードの前に入る
//   ・すべてのカードの中央より下(またはカードがない) → null(列の末尾)
function getDropBeforeElement(listElement, y) {
  const others = listElement.querySelectorAll(".card:not(.dragging)");
  for (const element of others) {
    const rect = element.getBoundingClientRect();
    if (y < rect.top + rect.height / 2) {
      return element;
    }
  }
  return null;
}

// 挿入位置に線を表示する(前の線は消す)
function showDropIndicator(listElement, beforeElement) {
  clearDropIndicator();
  if (beforeElement) {
    beforeElement.classList.add("drop-before");
  } else {
    listElement.querySelector(".cards").classList.add("drop-end");
  }
}

// --- つかんだとき ---
boardElement.addEventListener("dragstart", function (event) {
  const cardElement = event.target.closest(".card");
  if (!cardElement) {
    return;
  }
  draggedId = cardElement.dataset.id;
  cardElement.classList.add("dragging"); // 見た目を変える(CSSで半透明にする)

  // Firefoxではドラッグするデータを設定しないと動かないため、念のため入れる
  event.dataTransfer.setData("text/plain", draggedId);
  event.dataTransfer.effectAllowed = "move";
});

// --- 列の上を通っているとき ---
boardElement.addEventListener("dragover", function (event) {
  const listElement = event.target.closest(".list");
  if (!listElement || draggedId === null) {
    return;
  }
  // ブラウザは初期設定では「ここにはドロップできない」ので、
  // preventDefault() で「ここにドロップしてOK」と知らせる
  event.preventDefault();
  listElement.classList.add("drag-over");
  showDropIndicator(listElement, getDropBeforeElement(listElement, event.clientY));
});

// --- 列から出たとき ---
boardElement.addEventListener("dragleave", function (event) {
  const listElement = event.target.closest(".list");
  // 列の中の別の部品に移っただけのときは、強調を消さない
  if (listElement && !listElement.contains(event.relatedTarget)) {
    listElement.classList.remove("drag-over");
    clearDropIndicator();
  }
});

// --- 列の上で離したとき ---
boardElement.addEventListener("drop", function (event) {
  const listElement = event.target.closest(".list");
  if (!listElement || draggedId === null) {
    return;
  }
  event.preventDefault();

  // 離した位置: どのカードの前に入るか(null なら列の末尾)。clearDragOver の前に求める
  const listId = listElement.dataset.list;
  const beforeElement = getDropBeforeElement(listElement, event.clientY);
  const beforeId = beforeElement ? beforeElement.dataset.id : null;
  clearDragOver();

  const card = cards.find(function (c) {
    return c.id === draggedId;
  });
  draggedId = null;

  if (!card) {
    return;
  }

  // 元と同じ位置に離したときは、何も変えず、保存もしない。
  // 「同じ位置」= 同じ列で、今のすぐ後ろのカードの前(または末尾)に離したとき
  const listCards = cards.filter(function (c) {
    return c.list === listId;
  });
  const index = listCards.indexOf(card); // 別の列なら -1
  if (index >= 0) {
    const nextCard = listCards[index + 1];
    const currentBeforeId = nextCard ? nextCard.id : null;
    if (beforeId === currentBeforeId) {
      return; // ドラッグ中の見た目は、このあとの dragend が元に戻す
    }
  }

  // 所属する列を変え、配列の中の離した位置へ入れる
  card.list = listId;
  cards = cards.filter(function (c) {
    return c.id !== card.id;
  });
  const at =
    beforeId === null
      ? -1
      : cards.findIndex(function (c) {
          return c.id === beforeId;
        });
  if (at < 0) {
    cards.push(card); // 列の末尾(配列の最後)
  } else {
    cards.splice(at, 0, card); // 基準カードの直前
  }

  update(); // 保存 → 画面更新(矢印ボタン移動と同じ)
});

// --- ドラッグが終わったとき(列の外で離した場合なども含む) ---
boardElement.addEventListener("dragend", function () {
  draggedId = null;
  clearDragOver();
  document.querySelectorAll(".card.dragging").forEach(function (card) {
    card.classList.remove("dragging");
  });
});

// =====================================================
// 起動時の処理
// =====================================================
// 初回(サンプル表示)も保存データがある場合も、同じ手順で画面に表示する。
// 初回は保存データがないので、サンプルカードをここで保存しておく。
update();
