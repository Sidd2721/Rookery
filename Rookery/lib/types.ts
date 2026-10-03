export interface Office {
  id: string;
  name_mr: string;
  name_en: string;
}

export interface Item {
  id: string;
  label_mr: string;
  label_en: string;
  how_mr: string;
  how_en: string;
}

export interface Service {
  id: string;
  office_id: string;
  name_mr: string;
  name_en: string;
  duration_min: number;
  checklist: Item[];
}

export type VisitStatus = 'gathering' | 'ready' | 'serving' | 'done' | 'sent_back';

export interface Visit {
  id: string;
  office_id: string;
  service_id: string;
  items_checked: string[];
  status: VisitStatus;
  token_no: number | null;
  sent_back_reason: string | null;
  created_at: string;
  ready_at: string | null;
}
