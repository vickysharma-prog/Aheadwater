// Scores the bacteria model exported by ml/train.py (LightGBM dump_model JSON).

type Node =
  | { leaf_value: number }
  | {
      split_feature: number;
      threshold: number;
      default_left: boolean;
      missing_type: "NaN" | "None" | "Zero";
      left_child: Node;
      right_child: Node;
    };

export type Model = { feature_names: string[]; tree_info: { tree_structure: Node }[] };

function leaf(node: Node, row: (number | null)[]): number {
  while (!("leaf_value" in node)) {
    let x = row[node.split_feature];
    const missing = x === null || Number.isNaN(x);
    if (missing && node.missing_type === "NaN") {
      node = node.default_left ? node.left_child : node.right_child;
      continue;
    }
    if (missing) x = 0;
    node = (x as number) <= node.threshold ? node.left_child : node.right_child;
  }
  return node.leaf_value;
}

/** Probability that the next sample breaks the limit. row is ordered like model.feature_names. */
export function score(model: Model, row: (number | null)[]): number {
  const raw = model.tree_info.reduce((sum, t) => sum + leaf(t.tree_structure, row), 0);
  return 1 / (1 + Math.exp(-raw));
}

/** Same as score, from named features. Missing names count as unknown. */
export function scoreNamed(model: Model, features: Record<string, number | null>): number {
  return score(model, model.feature_names.map((f) => features[f] ?? null));
}
