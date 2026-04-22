const POS_LABELS = {
  "n.": "名词",
  "v.": "动词",
  "adj.": "形容词",
  "adv.": "副词",
  "prep.": "介词",
  "pron.": "代词",
  "conj.": "连词",
  "num.": "数词",
  "int.": "感叹词",
  "art.": "冠词"
};

const BASE_WORD_BANK = [
  { id: "cet4-001", word: "abandon", meaning: "放弃", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-002", word: "ability", meaning: "能力", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-003", word: "accept", meaning: "接受", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-004", word: "achieve", meaning: "实现", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-005", word: "active", meaning: "积极的", partOfSpeech: "adj.", difficulty: "easy" },
  { id: "cet4-006", word: "adapt", meaning: "适应", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-007", word: "admire", meaning: "钦佩", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-008", word: "advance", meaning: "前进", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-009", word: "affect", meaning: "影响", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-010", word: "approach", meaning: "接近", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-011", word: "argue", meaning: "争论", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-012", word: "attend", meaning: "出席", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-013", word: "avoid", meaning: "避开", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-014", word: "benefit", meaning: "益处", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-015", word: "beyond", meaning: "超出", partOfSpeech: "prep.", difficulty: "medium" },
  { id: "cet4-016", word: "budget", meaning: "预算", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-017", word: "campus", meaning: "校园", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-018", word: "career", meaning: "职业", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-019", word: "certain", meaning: "确定的", partOfSpeech: "adj.", difficulty: "easy" },
  { id: "cet4-020", word: "challenge", meaning: "挑战", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-021", word: "comfort", meaning: "安慰", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-022", word: "compare", meaning: "比较", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-023", word: "complex", meaning: "复杂的", partOfSpeech: "adj.", difficulty: "easy" },
  { id: "cet4-024", word: "concern", meaning: "担忧", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-025", word: "connect", meaning: "连接", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-026", word: "consider", meaning: "考虑", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-027", word: "contact", meaning: "联系", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-028", word: "contain", meaning: "包含", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-029", word: "convenient", meaning: "方便的", partOfSpeech: "adj.", difficulty: "medium" },
  { id: "cet4-030", word: "culture", meaning: "文化", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-031", word: "damage", meaning: "损害", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-032", word: "debate", meaning: "辩论", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-033", word: "decade", meaning: "十年", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-034", word: "declare", meaning: "宣布", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-035", word: "decline", meaning: "下降", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-036", word: "deliver", meaning: "递送", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-037", word: "demand", meaning: "需求", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-038", word: "deserve", meaning: "值得", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-039", word: "design", meaning: "设计", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-040", word: "detail", meaning: "细节", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-041", word: "device", meaning: "设备", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-042", word: "discover", meaning: "发现", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-043", word: "distance", meaning: "距离", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-044", word: "effort", meaning: "努力", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-045", word: "encourage", meaning: "鼓励", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-046", word: "environment", meaning: "环境", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-047", word: "escape", meaning: "逃离", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-048", word: "essential", meaning: "必要的", partOfSpeech: "adj.", difficulty: "medium" },
  { id: "cet4-049", word: "exchange", meaning: "交换", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-050", word: "expand", meaning: "扩大", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-051", word: "experience", meaning: "经历", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-052", word: "explore", meaning: "探索", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-053", word: "feature", meaning: "特点", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-054", word: "focus", meaning: "专注", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-055", word: "frequent", meaning: "频繁的", partOfSpeech: "adj.", difficulty: "medium" },
  { id: "cet4-056", word: "generation", meaning: "一代人", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-057", word: "graduate", meaning: "毕业", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-058", word: "harm", meaning: "危害", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-059", word: "improve", meaning: "改善", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-060", word: "include", meaning: "包括", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-061", word: "increase", meaning: "增长", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-062", word: "independent", meaning: "独立的", partOfSpeech: "adj.", difficulty: "medium" },
  { id: "cet4-063", word: "influence", meaning: "影响力", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-064", word: "inform", meaning: "通知", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-065", word: "insist", meaning: "坚持", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-066", word: "issue", meaning: "问题", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-067", word: "journey", meaning: "旅程", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-068", word: "judge", meaning: "判断", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-069", word: "limit", meaning: "限制", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-070", word: "maintain", meaning: "维持", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-071", word: "manage", meaning: "管理", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-072", word: "measure", meaning: "措施", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-073", word: "method", meaning: "方法", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-074", word: "opportunity", meaning: "机会", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-075", word: "ordinary", meaning: "普通的", partOfSpeech: "adj.", difficulty: "easy" },
  { id: "cet4-076", word: "particular", meaning: "特定的", partOfSpeech: "adj.", difficulty: "medium" },
  { id: "cet4-077", word: "perform", meaning: "表现", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-078", word: "prefer", meaning: "更喜欢", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-079", word: "prevent", meaning: "阻止", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-080", word: "process", meaning: "过程", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-081", word: "promise", meaning: "承诺", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-082", word: "reduce", meaning: "减少", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-083", word: "reflect", meaning: "反映", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-084", word: "replace", meaning: "代替", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-085", word: "require", meaning: "需要", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-086", word: "respect", meaning: "尊重", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-087", word: "responsible", meaning: "负责的", partOfSpeech: "adj.", difficulty: "medium" },
  { id: "cet4-088", word: "result", meaning: "结果", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-089", word: "schedule", meaning: "日程", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-090", word: "seek", meaning: "寻找", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-091", word: "select", meaning: "选择", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-092", word: "solution", meaning: "解决办法", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-093", word: "source", meaning: "来源", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-094", word: "standard", meaning: "标准", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-095", word: "strategy", meaning: "策略", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-096", word: "suffer", meaning: "遭受", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-097", word: "support", meaning: "支持", partOfSpeech: "v.", difficulty: "easy" },
  { id: "cet4-098", word: "survey", meaning: "调查", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-099", word: "survive", meaning: "生存", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-100", word: "target", meaning: "目标", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-101", word: "tend", meaning: "倾向", partOfSpeech: "v.", difficulty: "medium" },
  { id: "cet4-102", word: "theory", meaning: "理论", partOfSpeech: "n.", difficulty: "medium" },
  { id: "cet4-103", word: "value", meaning: "价值", partOfSpeech: "n.", difficulty: "easy" },
  { id: "cet4-104", word: "variety", meaning: "多样性", partOfSpeech: "n.", difficulty: "medium" }
];

const WORD_DETAILS = {
  "cet4-001": {
    phonetic: "/əˈbændən/",
    senses: [
      { partOfSpeech: "v.", meaning: "放弃；遗弃" },
      { partOfSpeech: "n.", meaning: "放任；纵情" }
    ]
  },
  "cet4-002": {
    phonetic: "/əˈbɪləti/",
    senses: [
      { partOfSpeech: "n.", meaning: "能力；本领" },
      { partOfSpeech: "n.", meaning: "才能；智能" }
    ]
  },
  "cet4-003": {
    phonetic: "/əkˈsept/",
    senses: [
      { partOfSpeech: "v.", meaning: "接受；同意接纳" },
      { partOfSpeech: "v.", meaning: "承认；认可" }
    ]
  },
  "cet4-004": {
    phonetic: "/əˈtʃiːv/",
    senses: [
      { partOfSpeech: "v.", meaning: "实现；达到" },
      { partOfSpeech: "v.", meaning: "完成；取得" }
    ]
  },
  "cet4-005": {
    phonetic: "/ˈæktɪv/",
    senses: [
      { partOfSpeech: "adj.", meaning: "积极的；活跃的" },
      { partOfSpeech: "adj.", meaning: "主动的；在用的" }
    ]
  },
  "cet4-006": {
    phonetic: "/əˈdæpt/",
    senses: [
      { partOfSpeech: "v.", meaning: "适应；适合" },
      { partOfSpeech: "v.", meaning: "改编；调整" }
    ]
  },
  "cet4-007": {
    phonetic: "/ədˈmaɪə(r)/",
    senses: [
      { partOfSpeech: "v.", meaning: "钦佩；欣赏" },
      { partOfSpeech: "v.", meaning: "赞赏；羡慕" }
    ]
  },
  "cet4-008": {
    phonetic: "/ədˈvɑːns/",
    senses: [
      { partOfSpeech: "v.", meaning: "前进；推进" },
      { partOfSpeech: "n.", meaning: "进步；发展" }
    ]
  },
  "cet4-009": {
    phonetic: "/əˈfekt/",
    senses: [
      { partOfSpeech: "v.", meaning: "影响；作用于" },
      { partOfSpeech: "n.", meaning: "情感；感情" }
    ]
  },
  "cet4-010": {
    phonetic: "/əˈprəʊtʃ/",
    senses: [
      { partOfSpeech: "v.", meaning: "接近；着手处理" },
      { partOfSpeech: "n.", meaning: "方法；靠近" }
    ]
  },
  "cet4-011": {
    phonetic: "/ˈɑːɡjuː/",
    senses: [
      { partOfSpeech: "v.", meaning: "争论；辩论" },
      { partOfSpeech: "v.", meaning: "主张；论证" }
    ]
  },
  "cet4-012": {
    phonetic: "/əˈtend/",
    senses: [
      { partOfSpeech: "v.", meaning: "出席；参加" },
      { partOfSpeech: "v.", meaning: "照顾；照料" }
    ]
  },
  "cet4-013": {
    phonetic: "/əˈvɔɪd/",
    senses: [
      { partOfSpeech: "v.", meaning: "避开；回避" },
      { partOfSpeech: "v.", meaning: "防止；避免发生" }
    ]
  },
  "cet4-014": {
    phonetic: "/ˈbenɪfɪt/",
    senses: [
      { partOfSpeech: "n.", meaning: "益处；好处" },
      { partOfSpeech: "v.", meaning: "使受益；有利于" }
    ]
  },
  "cet4-015": {
    phonetic: "/bɪˈjɒnd/",
    senses: [
      { partOfSpeech: "prep.", meaning: "超出；晚于" },
      { partOfSpeech: "adv.", meaning: "在更远处；更进一步" }
    ]
  },
  "cet4-016": {
    phonetic: "/ˈbʌdʒɪt/",
    senses: [
      { partOfSpeech: "n.", meaning: "预算；经费" },
      { partOfSpeech: "v.", meaning: "编预算；安排开支" }
    ]
  },
  "cet4-017": { phonetic: "/ˈkæmpəs/" },
  "cet4-018": {
    phonetic: "/kəˈrɪə(r)/",
    senses: [
      { partOfSpeech: "n.", meaning: "职业；事业" },
      { partOfSpeech: "n.", meaning: "生涯；发展道路" }
    ]
  },
  "cet4-019": {
    phonetic: "/ˈsɜːtn/",
    senses: [
      { partOfSpeech: "adj.", meaning: "确定的；肯定的" },
      { partOfSpeech: "adj.", meaning: "某一；一定的" }
    ]
  },
  "cet4-020": {
    phonetic: "/ˈtʃælɪndʒ/",
    senses: [
      { partOfSpeech: "n.", meaning: "挑战；难题" },
      { partOfSpeech: "v.", meaning: "向……挑战；质疑" }
    ]
  },
  "cet4-021": {
    phonetic: "/ˈkʌmfət/",
    senses: [
      { partOfSpeech: "n.", meaning: "安慰；舒适" },
      { partOfSpeech: "v.", meaning: "安慰；使舒适" }
    ]
  },
  "cet4-022": {
    phonetic: "/kəmˈpeə(r)/",
    senses: [
      { partOfSpeech: "v.", meaning: "比较；对照" },
      { partOfSpeech: "v.", meaning: "比作；相比" }
    ]
  },
  "cet4-023": {
    phonetic: "/ˈkɒmpleks/",
    senses: [
      { partOfSpeech: "adj.", meaning: "复杂的；复合的" },
      { partOfSpeech: "n.", meaning: "综合体；建筑群" }
    ]
  },
  "cet4-024": {
    phonetic: "/kənˈsɜːn/",
    senses: [
      { partOfSpeech: "n.", meaning: "担忧；关切" },
      { partOfSpeech: "v.", meaning: "涉及；使担心" }
    ]
  },
  "cet4-025": {
    phonetic: "/kəˈnekt/",
    senses: [
      { partOfSpeech: "v.", meaning: "连接；联结" },
      { partOfSpeech: "v.", meaning: "联系；关联" }
    ]
  },
  "cet4-026": {
    phonetic: "/kənˈsɪdə(r)/",
    senses: [
      { partOfSpeech: "v.", meaning: "考虑；细想" },
      { partOfSpeech: "v.", meaning: "认为；把……视为" }
    ]
  },
  "cet4-027": {
    phonetic: "/ˈkɒntækt/",
    senses: [
      { partOfSpeech: "n.", meaning: "联系；接触" },
      { partOfSpeech: "v.", meaning: "联系；联络" }
    ]
  },
  "cet4-028": {
    phonetic: "/kənˈteɪn/",
    senses: [
      { partOfSpeech: "v.", meaning: "包含；容纳" },
      { partOfSpeech: "v.", meaning: "抑制；控制" }
    ]
  },
  "cet4-029": { phonetic: "/kənˈviːniənt/" },
  "cet4-030": {
    phonetic: "/ˈkʌltʃə(r)/",
    senses: [
      { partOfSpeech: "n.", meaning: "文化；文明" },
      { partOfSpeech: "n.", meaning: "修养；培养" }
    ]
  },
  "cet4-031": {
    phonetic: "/ˈdæmɪdʒ/",
    senses: [
      { partOfSpeech: "n.", meaning: "损害；损失" },
      { partOfSpeech: "v.", meaning: "损害；毁坏" }
    ]
  },
  "cet4-032": {
    phonetic: "/dɪˈbeɪt/",
    senses: [
      { partOfSpeech: "n.", meaning: "辩论；争论" },
      { partOfSpeech: "v.", meaning: "辩论；仔细讨论" }
    ]
  },
  "cet4-033": { phonetic: "/ˈdekeɪd/" },
  "cet4-034": {
    phonetic: "/dɪˈkleə(r)/",
    senses: [
      { partOfSpeech: "v.", meaning: "宣布；声明" },
      { partOfSpeech: "v.", meaning: "申报；表明" }
    ]
  },
  "cet4-035": {
    phonetic: "/dɪˈklaɪn/",
    senses: [
      { partOfSpeech: "v.", meaning: "下降；衰退" },
      { partOfSpeech: "n.", meaning: "减少；衰落" }
    ]
  },
  "cet4-036": {
    phonetic: "/dɪˈlɪvə(r)/",
    senses: [
      { partOfSpeech: "v.", meaning: "递送；投递" },
      { partOfSpeech: "v.", meaning: "发表；履行" }
    ]
  },
  "cet4-037": {
    phonetic: "/dɪˈmɑːnd/",
    senses: [
      { partOfSpeech: "n.", meaning: "需求；要求" },
      { partOfSpeech: "v.", meaning: "要求；强烈需要" }
    ]
  },
  "cet4-038": {
    phonetic: "/dɪˈzɜːv/",
    senses: [
      { partOfSpeech: "v.", meaning: "值得；应得" },
      { partOfSpeech: "v.", meaning: "应受；理应获得" }
    ]
  },
  "cet4-039": {
    phonetic: "/dɪˈzaɪn/",
    senses: [
      { partOfSpeech: "n.", meaning: "设计；图样" },
      { partOfSpeech: "v.", meaning: "设计；规划" }
    ]
  },
  "cet4-040": {
    phonetic: "/ˈdiːteɪl/",
    senses: [
      { partOfSpeech: "n.", meaning: "细节；详情" },
      { partOfSpeech: "v.", meaning: "详细说明；列举" }
    ]
  },
  "cet4-041": { phonetic: "/dɪˈvaɪs/" },
  "cet4-042": {
    phonetic: "/dɪˈskʌvə(r)/",
    senses: [
      { partOfSpeech: "v.", meaning: "发现；察觉" },
      { partOfSpeech: "v.", meaning: "了解到；发觉" }
    ]
  },
  "cet4-043": { phonetic: "/ˈdɪstəns/" },
  "cet4-044": {
    phonetic: "/ˈefət/",
    senses: [
      { partOfSpeech: "n.", meaning: "努力；尽力" },
      { partOfSpeech: "n.", meaning: "尝试；成就" }
    ]
  },
  "cet4-045": {
    phonetic: "/ɪnˈkʌrɪdʒ/",
    senses: [
      { partOfSpeech: "v.", meaning: "鼓励；激励" },
      { partOfSpeech: "v.", meaning: "促进；助长" }
    ]
  },
  "cet4-046": {
    phonetic: "/ɪnˈvaɪrənmənt/",
    senses: [
      { partOfSpeech: "n.", meaning: "环境；周围状况" },
      { partOfSpeech: "n.", meaning: "自然环境；客观条件" }
    ]
  },
  "cet4-047": {
    phonetic: "/ɪˈskeɪp/",
    senses: [
      { partOfSpeech: "v.", meaning: "逃离；逃脱" },
      { partOfSpeech: "n.", meaning: "逃跑；逃避" }
    ]
  },
  "cet4-048": {
    phonetic: "/ɪˈsenʃl/",
    senses: [
      { partOfSpeech: "adj.", meaning: "必要的；本质的" },
      { partOfSpeech: "n.", meaning: "必需品；要点" }
    ]
  },
  "cet4-049": {
    phonetic: "/ɪksˈtʃeɪndʒ/",
    senses: [
      { partOfSpeech: "v.", meaning: "交换；交流" },
      { partOfSpeech: "n.", meaning: "交换；交流活动" }
    ]
  },
  "cet4-050": {
    phonetic: "/ɪkˈspænd/",
    senses: [
      { partOfSpeech: "v.", meaning: "扩大；扩展" },
      { partOfSpeech: "v.", meaning: "详述；膨胀" }
    ]
  },
  "cet4-051": {
    phonetic: "/ɪkˈspɪəriəns/",
    senses: [
      { partOfSpeech: "n.", meaning: "经历；经验" },
      { partOfSpeech: "v.", meaning: "经历；体验" }
    ]
  },
  "cet4-052": {
    phonetic: "/ɪkˈsplɔː(r)/",
    senses: [
      { partOfSpeech: "v.", meaning: "探索；探究" },
      { partOfSpeech: "v.", meaning: "考察；研究" }
    ]
  },
  "cet4-053": {
    phonetic: "/ˈfiːtʃə(r)/",
    senses: [
      { partOfSpeech: "n.", meaning: "特点；特征" },
      { partOfSpeech: "v.", meaning: "以……为特色；由……主演" }
    ]
  },
  "cet4-054": {
    phonetic: "/ˈfəʊkəs/",
    senses: [
      { partOfSpeech: "v.", meaning: "专注；聚焦" },
      { partOfSpeech: "n.", meaning: "焦点；中心" }
    ]
  },
  "cet4-055": {
    phonetic: "/ˈfriːkwənt/",
    senses: [
      { partOfSpeech: "adj.", meaning: "频繁的；常见的" },
      { partOfSpeech: "v.", meaning: "常去；时常出入" }
    ]
  },
  "cet4-056": {
    phonetic: "/ˌdʒenəˈreɪʃn/",
    senses: [
      { partOfSpeech: "n.", meaning: "一代人；世代" },
      { partOfSpeech: "n.", meaning: "产生；生成" }
    ]
  },
  "cet4-057": {
    phonetic: "/ˈɡrædʒueɪt/",
    senses: [
      { partOfSpeech: "v.", meaning: "毕业；获得学位" },
      { partOfSpeech: "n.", meaning: "毕业生；研究生" }
    ]
  },
  "cet4-058": {
    phonetic: "/hɑːm/",
    senses: [
      { partOfSpeech: "n.", meaning: "危害；伤害" },
      { partOfSpeech: "v.", meaning: "伤害；损害" }
    ]
  },
  "cet4-059": {
    phonetic: "/ɪmˈpruːv/",
    senses: [
      { partOfSpeech: "v.", meaning: "改善；改进" },
      { partOfSpeech: "v.", meaning: "提高；增进" }
    ]
  },
  "cet4-060": {
    phonetic: "/ɪnˈkluːd/",
    senses: [
      { partOfSpeech: "v.", meaning: "包括；包含" },
      { partOfSpeech: "v.", meaning: "把……算入；列入" }
    ]
  },
  "cet4-061": {
    phonetic: "/ɪnˈkriːs/",
    senses: [
      { partOfSpeech: "v.", meaning: "增长；增加" },
      { partOfSpeech: "n.", meaning: "增长；增幅" }
    ]
  },
  "cet4-062": {
    phonetic: "/ˌɪndɪˈpendənt/",
    senses: [
      { partOfSpeech: "adj.", meaning: "独立的；自主的" },
      { partOfSpeech: "adj.", meaning: "不受控制的；无关的" }
    ]
  },
  "cet4-063": {
    phonetic: "/ˈɪnfluəns/",
    senses: [
      { partOfSpeech: "n.", meaning: "影响力；作用" },
      { partOfSpeech: "v.", meaning: "影响；左右" }
    ]
  },
  "cet4-064": {
    phonetic: "/ɪnˈfɔːm/",
    senses: [
      { partOfSpeech: "v.", meaning: "通知；告知" },
      { partOfSpeech: "v.", meaning: "了解情况；使熟悉" }
    ]
  },
  "cet4-065": {
    phonetic: "/ɪnˈsɪst/",
    senses: [
      { partOfSpeech: "v.", meaning: "坚持；坚决要求" },
      { partOfSpeech: "v.", meaning: "坚持认为；强调" }
    ]
  },
  "cet4-066": {
    phonetic: "/ˈɪʃuː/",
    senses: [
      { partOfSpeech: "n.", meaning: "问题；议题" },
      { partOfSpeech: "v.", meaning: "发布；发行" }
    ]
  },
  "cet4-067": { phonetic: "/ˈdʒɜːni/" },
  "cet4-068": {
    phonetic: "/dʒʌdʒ/",
    senses: [
      { partOfSpeech: "v.", meaning: "判断；评价" },
      { partOfSpeech: "n.", meaning: "法官；裁判" }
    ]
  },
  "cet4-069": {
    phonetic: "/ˈlɪmɪt/",
    senses: [
      { partOfSpeech: "n.", meaning: "限制；界限" },
      { partOfSpeech: "v.", meaning: "限制；限定" }
    ]
  },
  "cet4-070": {
    phonetic: "/meɪnˈteɪn/",
    senses: [
      { partOfSpeech: "v.", meaning: "维持；保持" },
      { partOfSpeech: "v.", meaning: "保养；坚持主张" }
    ]
  },
  "cet4-071": {
    phonetic: "/ˈmænɪdʒ/",
    senses: [
      { partOfSpeech: "v.", meaning: "管理；经营" },
      { partOfSpeech: "v.", meaning: "设法做到；应付" }
    ]
  },
  "cet4-072": {
    phonetic: "/ˈmeʒə(r)/",
    senses: [
      { partOfSpeech: "n.", meaning: "措施；尺寸" },
      { partOfSpeech: "v.", meaning: "测量；衡量" }
    ]
  },
  "cet4-073": {
    phonetic: "/ˈmeθəd/",
    senses: [
      { partOfSpeech: "n.", meaning: "方法；办法" },
      { partOfSpeech: "n.", meaning: "条理；方式" }
    ]
  },
  "cet4-074": {
    phonetic: "/ˌɒpəˈtjuːnəti/",
    senses: [
      { partOfSpeech: "n.", meaning: "机会；良机" },
      { partOfSpeech: "n.", meaning: "时机；契机" }
    ]
  },
  "cet4-075": {
    phonetic: "/ˈɔːdnri/",
    senses: [
      { partOfSpeech: "adj.", meaning: "普通的；平常的" },
      { partOfSpeech: "adj.", meaning: "一般的；日常的" }
    ]
  },
  "cet4-076": {
    phonetic: "/pəˈtɪkjələ(r)/",
    senses: [
      { partOfSpeech: "adj.", meaning: "特定的；特别的" },
      { partOfSpeech: "adj.", meaning: "挑剔的；讲究的" }
    ]
  },
  "cet4-077": {
    phonetic: "/pəˈfɔːm/",
    senses: [
      { partOfSpeech: "v.", meaning: "表现；执行" },
      { partOfSpeech: "v.", meaning: "表演；履行" }
    ]
  },
  "cet4-078": {
    phonetic: "/prɪˈfɜː(r)/",
    senses: [
      { partOfSpeech: "v.", meaning: "更喜欢；宁愿" },
      { partOfSpeech: "v.", meaning: "提升；提出" }
    ]
  },
  "cet4-079": {
    phonetic: "/prɪˈvent/",
    senses: [
      { partOfSpeech: "v.", meaning: "阻止；预防" },
      { partOfSpeech: "v.", meaning: "防止发生；妨碍" }
    ]
  },
  "cet4-080": {
    phonetic: "/ˈprəʊses/",
    senses: [
      { partOfSpeech: "n.", meaning: "过程；进程" },
      { partOfSpeech: "v.", meaning: "加工；处理" }
    ]
  },
  "cet4-081": {
    phonetic: "/ˈprɒmɪs/",
    senses: [
      { partOfSpeech: "n.", meaning: "承诺；希望" },
      { partOfSpeech: "v.", meaning: "承诺；保证" }
    ]
  },
  "cet4-082": {
    phonetic: "/rɪˈdjuːs/",
    senses: [
      { partOfSpeech: "v.", meaning: "减少；降低" },
      { partOfSpeech: "v.", meaning: "使陷入；使变成" }
    ]
  },
  "cet4-083": {
    phonetic: "/rɪˈflekt/",
    senses: [
      { partOfSpeech: "v.", meaning: "反映；反射" },
      { partOfSpeech: "v.", meaning: "认真思考；体现" }
    ]
  },
  "cet4-084": {
    phonetic: "/rɪˈpleɪs/",
    senses: [
      { partOfSpeech: "v.", meaning: "代替；替换" },
      { partOfSpeech: "v.", meaning: "放回原处；取代" }
    ]
  },
  "cet4-085": {
    phonetic: "/rɪˈkwaɪə(r)/",
    senses: [
      { partOfSpeech: "v.", meaning: "需要；要求" },
      { partOfSpeech: "v.", meaning: "命令；规定" }
    ]
  },
  "cet4-086": {
    phonetic: "/rɪˈspekt/",
    senses: [
      { partOfSpeech: "n.", meaning: "尊重；敬意" },
      { partOfSpeech: "v.", meaning: "尊敬；遵守" }
    ]
  },
  "cet4-087": {
    phonetic: "/rɪˈspɒnsəbl/",
    senses: [
      { partOfSpeech: "adj.", meaning: "负责的；有责任的" },
      { partOfSpeech: "adj.", meaning: "可靠的；需承担责任的" }
    ]
  },
  "cet4-088": {
    phonetic: "/rɪˈzʌlt/",
    senses: [
      { partOfSpeech: "n.", meaning: "结果；成果" },
      { partOfSpeech: "v.", meaning: "导致；结果是" }
    ]
  },
  "cet4-089": {
    phonetic: "/ˈskedʒuːl/",
    senses: [
      { partOfSpeech: "n.", meaning: "日程；时间表" },
      { partOfSpeech: "v.", meaning: "安排；排定" }
    ]
  },
  "cet4-090": {
    phonetic: "/siːk/",
    senses: [
      { partOfSpeech: "v.", meaning: "寻找；寻求" },
      { partOfSpeech: "v.", meaning: "请求；争取" }
    ]
  },
  "cet4-091": {
    phonetic: "/sɪˈlekt/",
    senses: [
      { partOfSpeech: "v.", meaning: "选择；挑选" },
      { partOfSpeech: "adj.", meaning: "精选的；挑出来的" }
    ]
  },
  "cet4-092": {
    phonetic: "/səˈluːʃn/",
    senses: [
      { partOfSpeech: "n.", meaning: "解决办法；答案" },
      { partOfSpeech: "n.", meaning: "溶液；解法" }
    ]
  },
  "cet4-093": {
    phonetic: "/sɔːs/",
    senses: [
      { partOfSpeech: "n.", meaning: "来源；出处" },
      { partOfSpeech: "n.", meaning: "根源；消息源" }
    ]
  },
  "cet4-094": {
    phonetic: "/ˈstændəd/",
    senses: [
      { partOfSpeech: "n.", meaning: "标准；规范" },
      { partOfSpeech: "adj.", meaning: "标准的；常规的" }
    ]
  },
  "cet4-095": {
    phonetic: "/ˈstrætədʒi/",
    senses: [
      { partOfSpeech: "n.", meaning: "策略；战略" },
      { partOfSpeech: "n.", meaning: "行动方案；对策" }
    ]
  },
  "cet4-096": {
    phonetic: "/ˈsʌfə(r)/",
    senses: [
      { partOfSpeech: "v.", meaning: "遭受；忍受" },
      { partOfSpeech: "v.", meaning: "患病；受损失" }
    ]
  },
  "cet4-097": {
    phonetic: "/səˈpɔːt/",
    senses: [
      { partOfSpeech: "v.", meaning: "支持；支撑" },
      { partOfSpeech: "n.", meaning: "支持；帮助" }
    ]
  },
  "cet4-098": {
    phonetic: "/ˈsɜːveɪ/",
    senses: [
      { partOfSpeech: "n.", meaning: "调查；概览" },
      { partOfSpeech: "v.", meaning: "调查；勘测" }
    ]
  },
  "cet4-099": {
    phonetic: "/səˈvaɪv/",
    senses: [
      { partOfSpeech: "v.", meaning: "生存；幸存" },
      { partOfSpeech: "v.", meaning: "挺过；比……活得久" }
    ]
  },
  "cet4-100": {
    phonetic: "/ˈtɑːɡɪt/",
    senses: [
      { partOfSpeech: "n.", meaning: "目标；对象" },
      { partOfSpeech: "v.", meaning: "把……作为目标；瞄准" }
    ]
  },
  "cet4-101": {
    phonetic: "/tend/",
    senses: [
      { partOfSpeech: "v.", meaning: "倾向；往往会" },
      { partOfSpeech: "v.", meaning: "照料；看护" }
    ]
  },
  "cet4-102": {
    phonetic: "/ˈθɪəri/",
    senses: [
      { partOfSpeech: "n.", meaning: "理论；学说" },
      { partOfSpeech: "n.", meaning: "看法；原理" }
    ]
  },
  "cet4-103": {
    phonetic: "/ˈvæljuː/",
    senses: [
      { partOfSpeech: "n.", meaning: "价值；重要性" },
      { partOfSpeech: "v.", meaning: "重视；给……估价" }
    ]
  },
  "cet4-104": {
    phonetic: "/vəˈraɪəti/",
    senses: [
      { partOfSpeech: "n.", meaning: "多样性；种类" },
      { partOfSpeech: "n.", meaning: "变化；品种" }
    ]
  }
};

const LEVEL_OPTIONS = [
  { id: "beginner", label: "初学者", description: "从最基础的生活高频词开始，不超出启蒙范围。" },
  { id: "primary", label: "小学", description: "以小学阶段常见场景词为主，偏日常校园表达。" },
  { id: "middle", label: "中学", description: "覆盖初中到高中常见高频词，难度适中。" },
  { id: "university", label: "大学", description: "以大学校园与基础学术场景词为主。" },
  { id: "cet4", label: "CET-4", description: "使用四级常见核心词，更适合系统备考。" },
  { id: "cet6", label: "CET-6", description: "使用六级进阶词汇，但控制在六级范围内。" }
];

function supplementalWord(id, level, word, meaning, partOfSpeech, difficulty, phonetic, senses) {
  return { id, level, word, meaning, partOfSpeech, difficulty, phonetic, senses };
}

const SUPPLEMENTAL_WORD_BANK = [
  supplementalWord("beginner-001", "beginner", "book", "书", "n.", "easy", "/bʊk/", [
    { partOfSpeech: "n.", meaning: "书；书本" },
    { partOfSpeech: "v.", meaning: "预订；预约" }
  ]),
  supplementalWord("beginner-002", "beginner", "call", "打电话", "v.", "easy", "/kɔːl/", [
    { partOfSpeech: "v.", meaning: "打电话；呼喊" },
    { partOfSpeech: "n.", meaning: "电话；呼叫" }
  ]),
  supplementalWord("beginner-003", "beginner", "clean", "干净的", "adj.", "easy", "/kliːn/", [
    { partOfSpeech: "adj.", meaning: "干净的；整洁的" },
    { partOfSpeech: "v.", meaning: "打扫；清洁" }
  ]),
  supplementalWord("beginner-004", "beginner", "close", "关闭", "v.", "easy", "/kləʊz/", [
    { partOfSpeech: "v.", meaning: "关闭；合上" },
    { partOfSpeech: "adj.", meaning: "近的；亲密的" }
  ]),
  supplementalWord("beginner-005", "beginner", "drink", "喝", "v.", "easy", "/drɪŋk/", [
    { partOfSpeech: "v.", meaning: "喝；饮" },
    { partOfSpeech: "n.", meaning: "饮料；一杯酒" }
  ]),
  supplementalWord("beginner-006", "beginner", "help", "帮助", "v.", "easy", "/help/", [
    { partOfSpeech: "v.", meaning: "帮助；援助" },
    { partOfSpeech: "n.", meaning: "帮助；帮手" }
  ]),
  supplementalWord("beginner-007", "beginner", "home", "家", "n.", "easy", "/həʊm/", [
    { partOfSpeech: "n.", meaning: "家；住宅" },
    { partOfSpeech: "adv.", meaning: "在家；回家" }
  ]),
  supplementalWord("beginner-008", "beginner", "light", "灯", "n.", "easy", "/laɪt/", [
    { partOfSpeech: "n.", meaning: "灯；光" },
    { partOfSpeech: "adj.", meaning: "轻的；明亮的" }
  ]),
  supplementalWord("beginner-009", "beginner", "play", "玩", "v.", "easy", "/pleɪ/", [
    { partOfSpeech: "v.", meaning: "玩；参加（比赛）" },
    { partOfSpeech: "n.", meaning: "戏剧；比赛表现" }
  ]),
  supplementalWord("beginner-010", "beginner", "watch", "看", "v.", "easy", "/wɒtʃ/", [
    { partOfSpeech: "v.", meaning: "看；注视" },
    { partOfSpeech: "n.", meaning: "手表；观看" }
  ]),

  supplementalWord("primary-001", "primary", "answer", "回答", "v.", "easy", "/ˈɑːnsə(r)/", [
    { partOfSpeech: "v.", meaning: "回答；答复" },
    { partOfSpeech: "n.", meaning: "答案；回答" }
  ]),
  supplementalWord("primary-002", "primary", "change", "改变", "v.", "easy", "/tʃeɪndʒ/", [
    { partOfSpeech: "v.", meaning: "改变；更换" },
    { partOfSpeech: "n.", meaning: "变化；零钱" }
  ]),
  supplementalWord("primary-003", "primary", "class", "班级", "n.", "easy", "/klɑːs/", [
    { partOfSpeech: "n.", meaning: "班级；课堂" },
    { partOfSpeech: "n.", meaning: "等级；类别" }
  ]),
  supplementalWord("primary-004", "primary", "dance", "跳舞", "v.", "easy", "/dɑːns/", [
    { partOfSpeech: "v.", meaning: "跳舞；舞动" },
    { partOfSpeech: "n.", meaning: "舞蹈；舞会" }
  ]),
  supplementalWord("primary-005", "primary", "dream", "梦想", "n.", "easy", "/driːm/", [
    { partOfSpeech: "n.", meaning: "梦想；梦" },
    { partOfSpeech: "v.", meaning: "做梦；梦想" }
  ]),
  supplementalWord("primary-006", "primary", "plant", "植物", "n.", "easy", "/plɑːnt/", [
    { partOfSpeech: "n.", meaning: "植物；工厂" },
    { partOfSpeech: "v.", meaning: "种植；安放" }
  ]),
  supplementalWord("primary-007", "primary", "question", "问题", "n.", "easy", "/ˈkwestʃən/", [
    { partOfSpeech: "n.", meaning: "问题；提问" },
    { partOfSpeech: "v.", meaning: "询问；质疑" }
  ]),
  supplementalWord("primary-008", "primary", "show", "展示", "v.", "easy", "/ʃəʊ/", [
    { partOfSpeech: "v.", meaning: "展示；表明" },
    { partOfSpeech: "n.", meaning: "节目；展览" }
  ]),
  supplementalWord("primary-009", "primary", "smile", "微笑", "n.", "easy", "/smaɪl/", [
    { partOfSpeech: "n.", meaning: "微笑；笑容" },
    { partOfSpeech: "v.", meaning: "微笑；露出笑容" }
  ]),
  supplementalWord("primary-010", "primary", "visit", "参观", "v.", "easy", "/ˈvɪzɪt/", [
    { partOfSpeech: "v.", meaning: "参观；拜访" },
    { partOfSpeech: "n.", meaning: "访问；参观" }
  ]),

  supplementalWord("middle-001", "middle", "achieve", "实现", "v.", "medium", "/əˈtʃiːv/", [
    { partOfSpeech: "v.", meaning: "实现；达到" },
    { partOfSpeech: "v.", meaning: "完成；取得成功" }
  ]),
  supplementalWord("middle-002", "middle", "compare", "比较", "v.", "medium", "/kəmˈpeə(r)/", [
    { partOfSpeech: "v.", meaning: "比较；对照" },
    { partOfSpeech: "v.", meaning: "把……比作" }
  ]),
  supplementalWord("middle-003", "middle", "cover", "覆盖", "v.", "medium", "/ˈkʌvə(r)/", [
    { partOfSpeech: "v.", meaning: "覆盖；包括" },
    { partOfSpeech: "n.", meaning: "盖子；封面" }
  ]),
  supplementalWord("middle-004", "middle", "design", "设计", "n.", "medium", "/dɪˈzaɪn/", [
    { partOfSpeech: "n.", meaning: "设计；图案" },
    { partOfSpeech: "v.", meaning: "设计；构思" }
  ]),
  supplementalWord("middle-005", "middle", "experience", "经历", "n.", "medium", "/ɪkˈspɪəriəns/", [
    { partOfSpeech: "n.", meaning: "经历；经验" },
    { partOfSpeech: "v.", meaning: "经历；体验" }
  ]),
  supplementalWord("middle-006", "middle", "improve", "改善", "v.", "medium", "/ɪmˈpruːv/", [
    { partOfSpeech: "v.", meaning: "改善；提高" },
    { partOfSpeech: "v.", meaning: "增进；改进" }
  ]),
  supplementalWord("middle-007", "middle", "notice", "注意到", "v.", "medium", "/ˈnəʊtɪs/", [
    { partOfSpeech: "v.", meaning: "注意到；留意" },
    { partOfSpeech: "n.", meaning: "通知；注意" }
  ]),
  supplementalWord("middle-008", "middle", "practice", "练习", "n.", "medium", "/ˈpræktɪs/", [
    { partOfSpeech: "n.", meaning: "练习；实践" },
    { partOfSpeech: "v.", meaning: "练习；从事" }
  ]),
  supplementalWord("middle-009", "middle", "report", "报告", "n.", "medium", "/rɪˈpɔːt/", [
    { partOfSpeech: "n.", meaning: "报告；报道" },
    { partOfSpeech: "v.", meaning: "报告；汇报" }
  ]),
  supplementalWord("middle-010", "middle", "support", "支持", "v.", "medium", "/səˈpɔːt/", [
    { partOfSpeech: "v.", meaning: "支持；支撑" },
    { partOfSpeech: "n.", meaning: "支持；帮助" }
  ]),

  supplementalWord("university-001", "university", "academic", "学术的", "adj.", "medium", "/ˌækəˈdemɪk/", [
    { partOfSpeech: "adj.", meaning: "学术的；教学的" },
    { partOfSpeech: "n.", meaning: "大学教师；学者" }
  ]),
  supplementalWord("university-002", "university", "analyze", "分析", "v.", "medium", "/ˈænəlaɪz/", [
    { partOfSpeech: "v.", meaning: "分析；解析" },
    { partOfSpeech: "v.", meaning: "分解研究；剖析" }
  ]),
  supplementalWord("university-003", "university", "campus", "校园", "n.", "easy", "/ˈkæmpəs/", [
    { partOfSpeech: "n.", meaning: "校园；校区" },
    { partOfSpeech: "n.", meaning: "大学场地范围" }
  ]),
  supplementalWord("university-004", "university", "communicate", "交流", "v.", "medium", "/kəˈmjuːnɪkeɪt/", [
    { partOfSpeech: "v.", meaning: "交流；沟通" },
    { partOfSpeech: "v.", meaning: "传达；传递信息" }
  ]),
  supplementalWord("university-005", "university", "lecture", "讲座", "n.", "medium", "/ˈlektʃə(r)/", [
    { partOfSpeech: "n.", meaning: "讲座；课" },
    { partOfSpeech: "v.", meaning: "讲课；训斥" }
  ]),
  supplementalWord("university-006", "university", "major", "专业", "n.", "medium", "/ˈmeɪdʒə(r)/", [
    { partOfSpeech: "n.", meaning: "专业；主修科目" },
    { partOfSpeech: "adj.", meaning: "主要的；重大的" }
  ]),
  supplementalWord("university-007", "university", "project", "项目", "n.", "medium", "/ˈprɒdʒekt/", [
    { partOfSpeech: "n.", meaning: "项目；课题" },
    { partOfSpeech: "v.", meaning: "投射；规划" }
  ]),
  supplementalWord("university-008", "university", "record", "记录", "n.", "medium", "/ˈrekɔːd/", [
    { partOfSpeech: "n.", meaning: "记录；成绩" },
    { partOfSpeech: "v.", meaning: "记录；录制" }
  ]),
  supplementalWord("university-009", "university", "resource", "资源", "n.", "medium", "/rɪˈzɔːs/", [
    { partOfSpeech: "n.", meaning: "资源；资料" },
    { partOfSpeech: "n.", meaning: "办法；应对手段" }
  ]),
  supplementalWord("university-010", "university", "seminar", "研讨课", "n.", "medium", "/ˈsemɪnɑː(r)/", [
    { partOfSpeech: "n.", meaning: "研讨课；讨论会" },
    { partOfSpeech: "n.", meaning: "学术研讨活动" }
  ]),

  supplementalWord("cet6-001", "cet6", "abstract", "抽象的", "adj.", "hard", "/ˈæbstrækt/", [
    { partOfSpeech: "adj.", meaning: "抽象的；理论上的" },
    { partOfSpeech: "n.", meaning: "摘要；概括" }
  ]),
  supplementalWord("cet6-002", "cet6", "advocate", "提倡", "v.", "hard", "/ˈædvəkeɪt/", [
    { partOfSpeech: "v.", meaning: "提倡；主张" },
    { partOfSpeech: "n.", meaning: "拥护者；提倡者" }
  ]),
  supplementalWord("cet6-003", "cet6", "brief", "简短的", "adj.", "medium", "/briːf/", [
    { partOfSpeech: "adj.", meaning: "简短的；短暂的" },
    { partOfSpeech: "n.", meaning: "摘要；任务简介" }
  ]),
  supplementalWord("cet6-004", "cet6", "conventional", "传统的", "adj.", "hard", "/kənˈvenʃənl/", [
    { partOfSpeech: "adj.", meaning: "传统的；常规的" },
    { partOfSpeech: "adj.", meaning: "习惯的；守旧的" }
  ]),
  supplementalWord("cet6-005", "cet6", "demonstrate", "证明", "v.", "hard", "/ˈdemənstreɪt/", [
    { partOfSpeech: "v.", meaning: "证明；表明" },
    { partOfSpeech: "v.", meaning: "演示；示范" }
  ]),
  supplementalWord("cet6-006", "cet6", "enhance", "增强", "v.", "hard", "/ɪnˈhɑːns/", [
    { partOfSpeech: "v.", meaning: "增强；提高" },
    { partOfSpeech: "v.", meaning: "改善；增进" }
  ]),
  supplementalWord("cet6-007", "cet6", "inevitable", "不可避免的", "adj.", "hard", "/ɪnˈevɪtəbl/", [
    { partOfSpeech: "adj.", meaning: "不可避免的；必然发生的" },
    { partOfSpeech: "adj.", meaning: "无法防止的；必然的" }
  ]),
  supplementalWord("cet6-008", "cet6", "justify", "证明……合理", "v.", "hard", "/ˈdʒʌstɪfaɪ/", [
    { partOfSpeech: "v.", meaning: "证明……合理；为……辩护" },
    { partOfSpeech: "v.", meaning: "说明……有理由；使正当" }
  ]),
  supplementalWord("cet6-009", "cet6", "priority", "优先事项", "n.", "hard", "/praɪˈɒrəti/", [
    { partOfSpeech: "n.", meaning: "优先事项；重点" },
    { partOfSpeech: "n.", meaning: "优先权；优先次序" }
  ]),
  supplementalWord("cet6-010", "cet6", "transform", "改变", "v.", "hard", "/trænsˈfɔːm/", [
    { partOfSpeech: "v.", meaning: "改变；改造" },
    { partOfSpeech: "v.", meaning: "使转变；变形" }
  ])
];

function normalizeWordEntry(item) {
  const senses = (item.senses || [
    { partOfSpeech: item.partOfSpeech, meaning: item.meaning }
  ]).map((sense) => ({
    ...sense,
    label: sense.label || POS_LABELS[sense.partOfSpeech] || "词性"
  }));

  return {
    ...item,
    phonetic: item.phonetic || "",
    senses
  };
}

const WORD_BANK = [
  ...BASE_WORD_BANK.map((item) => {
    const details = WORD_DETAILS[item.id] || {};
    return normalizeWordEntry({
      ...item,
      level: "cet4",
      phonetic: details.phonetic,
      senses: details.senses
    });
  }),
  ...SUPPLEMENTAL_WORD_BANK.map((item) => normalizeWordEntry(item)),
  ...(typeof GENERATED_WORD_BANK === "undefined" ? [] : GENERATED_WORD_BANK).map((item) => normalizeWordEntry(item))
];
