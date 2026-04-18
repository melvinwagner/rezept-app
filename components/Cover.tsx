import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export type CoverLayoutId =
  | "classic"
  | "minimal"
  | "editorial"
  | "brutalist"
  | "craft"
  | "bento";

export const COVER_LAYOUTS: { id: CoverLayoutId; name: string }[] = [
  { id: "classic", name: "Classic" },
  { id: "minimal", name: "Minimal" },
  { id: "editorial", name: "Editorial" },
  { id: "brutalist", name: "Brutalist" },
  { id: "craft", name: "Craft" },
  { id: "bento", name: "Bento" },
];

export const COVER_PALETTE: { name: string; grad: [string, string] }[] = [
  { name: "Waldgrün", grad: ["#6B8B68", "#1E2E1A"] },
  { name: "Salbei", grad: ["#8AAA7A", "#2A3E22"] },
  { name: "Terrakotta", grad: ["#A09078", "#3A2818"] },
  { name: "Mokka", grad: ["#9A8A72", "#2E2418"] },
  { name: "Schieferblau", grad: ["#8890A0", "#282E3A"] },
  { name: "Rosewood", grad: ["#A08A8A", "#382828"] },
  { name: "Olive", grad: ["#90987A", "#2A2E1A"] },
  { name: "Karamell", grad: ["#B09070", "#3A2010"] },
  { name: "Lavendel", grad: ["#9A8898", "#2E2430"] },
];

export type CoverProps = {
  layout: CoverLayoutId;
  gradient: [string, string];
  name: string;
  handle?: string;
  tagline?: string;
  edition?: string;
  stats?: { label: string; value: string | number }[];
  width?: number;
};

const GOLD = "#f4d88f";
const GOLD_SOFT = "rgba(244,216,143,0.6)";
const GOLD_SOFTER = "rgba(244,216,143,0.35)";
const GOLD_MUTED = "rgba(244,216,143,0.5)";
const CREAM = "#fefaf0";

function initials(name: string) {
  if (!name) return "D";
  return name.trim().split(/\s+/)[0][0].toUpperCase();
}

export function Cover({
  layout,
  gradient,
  name,
  handle = "",
  tagline = "Ein Archiv in Bewegung",
  edition = "Edition 2026",
  stats = [
    { label: "Rezepte", value: 0 },
    { label: "Bücher", value: 0 },
    { label: "Streak", value: 0 },
  ],
  width = 180,
}: CoverProps) {
  const [first, ...rest] = name.split(/\s+/);
  const last = rest.join(" ");
  const ini = initials(name);

  const wrapper: ViewStyle = {
    width,
    aspectRatio: 2 / 3,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
  } as any;

  const spine = <View style={styles.spine} />;
  const bg = (
    <LinearGradient
      colors={gradient}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );

  switch (layout) {
    case "classic":
      return (
        <View style={wrapper}>
          {bg}
          {spine}
          <Text style={[styles.brandTop, { color: GOLD_SOFT }]}>— DAWG Kitchen —</Text>
          <View style={styles.classicCrest}>
            <Text style={styles.classicCrestLetter}>{ini}</Text>
          </View>
          <View style={[styles.divH, styles.div32]} />
          <View style={styles.titleBlock}>
            <Text style={styles.classicTitle}>{first}</Text>
            {last ? <Text style={styles.classicTitle}>{last}</Text> : null}
          </View>
          <Text style={styles.classicSub}>{tagline?.toUpperCase()}</Text>
          <View style={[styles.divH, styles.div62]} />
          <StatsRow stats={stats} topPercent="66%" />
          <View style={[styles.divH, styles.div82]} />
          <Text style={styles.classicFoot}>— {edition.toUpperCase()} —</Text>
        </View>
      );

    case "minimal":
      return (
        <View style={wrapper}>
          {bg}
          {spine}
          <View style={styles.minMono}>
            <Text style={styles.minMonoText}>{ini}</Text>
          </View>
          <Text style={styles.minEditionTag}>Nº 0042</Text>
          <View style={styles.minTitleWrap}>
            <Text style={styles.minTitle}>{first}</Text>
            {last ? <Text style={styles.minTitleBold}>{last}.</Text> : null}
          </View>
          {handle ? <Text style={styles.minHandle}>{handle}</Text> : null}
          <View style={styles.minDivider} />
          <StatsRowLeft stats={stats} color={CREAM} />
          <Text style={styles.minFoot}>DAWG · {edition}</Text>
        </View>
      );

    case "editorial":
      return (
        <View style={wrapper}>
          {bg}
          {spine}
          <Text style={styles.edNum}>№ 42</Text>
          <Text style={styles.edVol}>Vol. IV</Text>
          <Text style={[styles.edEyebrow, { color: GOLD_SOFT }]}>Ein Kochbuch von</Text>
          <View style={styles.edTitleWrap}>
            <Text style={styles.edTitle}>{first}</Text>
            {last ? <Text style={styles.edTitle}>{last}</Text> : null}
          </View>
          <View style={styles.edHr} />
          <Text style={styles.edQuote}>„{tagline}"</Text>
          <View style={styles.edFoot}>
            <Text style={styles.edFootText}>{handle}</Text>
            <Text style={styles.edFootText}>{edition.replace("Edition ", "")}</Text>
          </View>
        </View>
      );

    case "brutalist":
      return (
        <View style={wrapper}>
          {bg}
          {spine}
          <View style={styles.brTopBar}>
            <Text style={styles.brTopText}>DAWG Kitchen</Text>
            <Text style={styles.brTopText}>Nº 0042</Text>
          </View>
          <View style={styles.brTitleWrap}>
            <Text style={styles.brTitle}>{first.toUpperCase()}</Text>
            {last ? <Text style={styles.brTitle}>{last.toUpperCase()}.</Text> : null}
          </View>
          <Text style={styles.brSub}>{tagline?.toUpperCase()}</Text>
          <View style={styles.brDiv} />
          <View style={styles.brStatsWrap}>
            {stats.map((s, i) => (
              <View key={i} style={{ alignItems: "flex-start" as any }}>
                <Text style={styles.brStatV}>{s.value}</Text>
                <Text style={styles.brStatL}>{s.label.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          <View style={styles.brBottomBar}>
            <Text style={styles.brBottomText}>DAWG · {edition.toUpperCase()}</Text>
          </View>
        </View>
      );

    case "craft":
      return (
        <View style={wrapper}>
          {bg}
          {spine}
          <View style={styles.craftStamp}>
            <Text style={styles.craftStampL}>Edition</Text>
            <Text style={styles.craftStampV}>0042</Text>
          </View>
          <Text style={styles.craftBrand}>DAWG Kitchen</Text>
          <View style={styles.craftLine} />
          <View style={styles.craftTitleWrap}>
            <Text style={styles.craftTitle}>{first}</Text>
            {last ? <Text style={styles.craftTitleItalic}>{last}</Text> : null}
          </View>
          <Text style={styles.craftSub}>„{tagline}"</Text>
          <Text style={styles.craftHand}>— mit liebe, {first}.</Text>
          <StatsRow stats={stats} topPercent="72%" valueStyle={{ color: "#fff" }} />
          <Text style={styles.craftFoot}>{handle} · {edition}</Text>
        </View>
      );

    case "bento":
      return (
        <View style={wrapper}>
          {bg}
          {spine}
          <View style={styles.bentoGrid}>
            <View style={[styles.bentoTile, styles.bentoMain]}>
              <Text style={styles.bentoBrand}>DAWG · Nº 0042</Text>
              <Text style={styles.bentoTitle}>{first}{last ? "\n" + last : ""}</Text>
              <Text style={styles.bentoSub}>{tagline}</Text>
            </View>
            {stats.map((s, i) => (
              <View key={i} style={styles.bentoTile}>
                <Text style={styles.bentoStatV}>{s.value}</Text>
                <Text style={styles.bentoStatL}>{s.label.toUpperCase()}</Text>
              </View>
            ))}
            <View style={[styles.bentoTile, styles.bentoWide]}>
              <Text style={styles.bentoFoot}>{edition.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      );
  }
}

function StatsRow({
  stats,
  topPercent,
  valueStyle,
}: {
  stats: { label: string; value: string | number }[];
  topPercent: string;
  valueStyle?: any;
}) {
  return (
    <View style={[styles.statsAbsRow, { top: topPercent as any }]}>
      {stats.map((s, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center" as any }}>
          <Text style={[styles.statVal, valueStyle]}>{s.value}</Text>
          <Text style={styles.statLbl}>{s.label.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

function StatsRowLeft({
  stats,
  color,
}: {
  stats: { label: string; value: string | number }[];
  color: string;
}) {
  return (
    <View style={styles.minStatsWrap}>
      {stats.map((s, i) => (
        <View key={i} style={{ flex: 1 }}>
          <Text style={[styles.minStatV, { color }]}>{s.value}</Text>
          <Text style={styles.minStatL}>{s.label.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  spine: {
    position: "absolute" as any,
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 5,
  },

  // Shared absolute positions for dividers
  divH: { position: "absolute" as any, left: "14%" as any, right: "14%" as any, height: 0.5, backgroundColor: GOLD_SOFTER } as any,
  div32: { top: "32%" as any },
  div62: { top: "62%" as any },
  div82: { top: "82%" as any },

  // Stats shared
  statsAbsRow: { position: "absolute" as any, left: "8%" as any, right: "8%" as any, flexDirection: "row" } as any,
  statVal: { color: "#fff", fontSize: 16, fontWeight: "900" },
  statLbl: { color: GOLD_MUTED, fontSize: 6, fontWeight: "700", letterSpacing: 1, marginTop: 2 },

  // Brand shared
  brandTop: {
    position: "absolute" as any,
    top: "5%" as any,
    left: 0,
    right: 0,
    textAlign: "center" as any,
    fontSize: 7,
    letterSpacing: 2,
    fontWeight: "700",
  } as any,

  // ============== CLASSIC ==============
  classicCrest: {
    position: "absolute" as any,
    top: "11%" as any,
    left: "50%" as any,
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: "center" as any,
    justifyContent: "center" as any,
  } as any,
  classicCrestLetter: { color: GOLD, fontSize: 20, fontWeight: "900" },
  titleBlock: {
    position: "absolute" as any,
    top: "36%" as any,
    left: 10,
    right: 10,
    alignItems: "center" as any,
  } as any,
  classicTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center" as any,
    letterSpacing: -0.8,
    lineHeight: 24,
  },
  classicSub: {
    position: "absolute" as any,
    top: "56%" as any,
    left: 10,
    right: 10,
    textAlign: "center" as any,
    fontSize: 7,
    color: GOLD_MUTED,
    fontWeight: "700",
    letterSpacing: 1.5,
  } as any,
  classicFoot: {
    position: "absolute" as any,
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: "center" as any,
    fontSize: 7,
    color: "rgba(244,216,143,0.4)",
    letterSpacing: 1.5,
    fontWeight: "700",
  } as any,

  // ============== MINIMAL ==============
  minMono: {
    position: "absolute" as any,
    top: 14,
    left: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.2,
    borderColor: "#fff",
    alignItems: "center" as any,
    justifyContent: "center" as any,
  } as any,
  minMonoText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  minEditionTag: {
    position: "absolute" as any,
    top: 16,
    right: 14,
    fontSize: 8,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 1,
  } as any,
  minTitleWrap: { position: "absolute" as any, top: "25%" as any, left: 14, right: 14 } as any,
  minTitle: { fontSize: 32, fontWeight: "300", color: "#fff", letterSpacing: -1.2, lineHeight: 32 },
  minTitleBold: { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: -1.2, lineHeight: 32 },
  minHandle: {
    position: "absolute" as any,
    top: "58%" as any,
    left: 14,
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase" as any,
  } as any,
  minDivider: {
    position: "absolute" as any,
    top: "66%" as any,
    left: 14,
    width: 28,
    height: 2.5,
    backgroundColor: "#fff",
  } as any,
  minStatsWrap: {
    position: "absolute" as any,
    top: "72%" as any,
    left: 14,
    right: 14,
    flexDirection: "row",
    gap: 8,
  } as any,
  minStatV: { fontSize: 18, fontWeight: "900", lineHeight: 20 },
  minStatL: { fontSize: 7, color: "rgba(255,255,255,0.65)", letterSpacing: 0.8, fontWeight: "700", marginTop: 2 },
  minFoot: {
    position: "absolute" as any,
    bottom: 8,
    right: 14,
    fontSize: 7,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
    letterSpacing: 1,
  } as any,

  // ============== EDITORIAL ==============
  edNum: { position: "absolute" as any, top: 14, left: 14, fontSize: 8, color: "rgba(255,255,255,0.55)", fontWeight: "700", letterSpacing: 1.5 } as any,
  edVol: { position: "absolute" as any, top: 14, right: 14, fontSize: 8, color: "rgba(255,255,255,0.55)", fontWeight: "700", letterSpacing: 1.5 } as any,
  edEyebrow: {
    position: "absolute" as any,
    top: "32%" as any,
    left: 10,
    right: 10,
    textAlign: "center" as any,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 2,
  } as any,
  edTitleWrap: {
    position: "absolute" as any,
    top: "40%" as any,
    left: 10,
    right: 10,
    alignItems: "center" as any,
  } as any,
  edTitle: { fontSize: 26, fontWeight: "300", color: "#fff", letterSpacing: -0.8, lineHeight: 28, textAlign: "center" as any },
  edHr: {
    position: "absolute" as any,
    top: "65%" as any,
    left: "50%" as any,
    marginLeft: -12,
    width: 24,
    height: 0.8,
    backgroundColor: "#fff",
  } as any,
  edQuote: {
    position: "absolute" as any,
    top: "70%" as any,
    left: 14,
    right: 14,
    textAlign: "center" as any,
    fontSize: 9,
    fontStyle: "italic" as any,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 13,
  } as any,
  edFoot: {
    position: "absolute" as any,
    bottom: 10,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  } as any,
  edFootText: { fontSize: 7, color: "rgba(255,255,255,0.55)", letterSpacing: 1, fontWeight: "700", textTransform: "uppercase" as any },

  // ============== BRUTALIST ==============
  brTopBar: {
    position: "absolute" as any,
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
  } as any,
  brTopText: { color: "#fff", fontSize: 8, fontWeight: "900", letterSpacing: 1.5 },
  brTitleWrap: { position: "absolute" as any, top: "16%" as any, left: 10, right: 10 } as any,
  brTitle: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.8,
    lineHeight: 38,
  },
  brSub: {
    position: "absolute" as any,
    top: "52%" as any,
    left: 10,
    right: 10,
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  } as any,
  brDiv: {
    position: "absolute" as any,
    top: "62%" as any,
    left: 10,
    right: 10,
    height: 1.5,
    backgroundColor: "#fff",
  } as any,
  brStatsWrap: {
    position: "absolute" as any,
    top: "66%" as any,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  } as any,
  brStatV: { color: "#fff", fontSize: 17, fontWeight: "900", lineHeight: 18, letterSpacing: -0.5 },
  brStatL: { color: "#fff", fontSize: 7, fontWeight: "900", letterSpacing: 1, marginTop: 2 },
  brBottomBar: {
    position: "absolute" as any,
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    borderTopWidth: 1.5,
    borderTopColor: "#fff",
    alignItems: "center" as any,
  } as any,
  brBottomText: { color: "#fff", fontSize: 7, fontWeight: "900", letterSpacing: 2 },

  // ============== CRAFT ==============
  craftStamp: {
    position: "absolute" as any,
    top: 10,
    right: 10,
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 24,
    alignItems: "center" as any,
    justifyContent: "center" as any,
    transform: [{ rotate: "-8deg" }],
  } as any,
  craftStampL: { fontSize: 6, color: GOLD, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" as any },
  craftStampV: { fontSize: 13, color: GOLD, fontWeight: "900" },
  craftBrand: {
    position: "absolute" as any,
    top: 14,
    left: 12,
    fontSize: 8,
    color: GOLD_SOFT,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase" as any,
  } as any,
  craftLine: {
    position: "absolute" as any,
    top: "22%" as any,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: GOLD_SOFTER,
  } as any,
  craftTitleWrap: { position: "absolute" as any, top: "26%" as any, left: 12, right: 12 } as any,
  craftTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.8, lineHeight: 26 },
  craftTitleItalic: { fontSize: 24, fontWeight: "400", fontStyle: "italic" as any, color: "#fff", letterSpacing: -0.4, lineHeight: 26 },
  craftSub: {
    position: "absolute" as any,
    top: "52%" as any,
    left: 12,
    right: 12,
    fontSize: 9,
    color: GOLD_MUTED,
    fontStyle: "italic" as any,
  } as any,
  craftHand: {
    position: "absolute" as any,
    top: "58%" as any,
    left: 12,
    fontSize: 12,
    color: GOLD,
    fontStyle: "italic" as any,
  } as any,
  craftFoot: {
    position: "absolute" as any,
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: "center" as any,
    fontSize: 7,
    color: "rgba(244,216,143,0.4)",
    fontWeight: "700",
    letterSpacing: 1,
  } as any,

  // ============== BENTO ==============
  bentoGrid: {
    padding: 6,
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  bentoTile: {
    width: "47%" as any,
    minHeight: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 8,
    alignItems: "center" as any,
    justifyContent: "center" as any,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  } as any,
  bentoMain: {
    width: "98%" as any,
    alignItems: "flex-start" as any,
    justifyContent: "space-between" as any,
    paddingVertical: 10,
    minHeight: 70,
  } as any,
  bentoWide: {
    width: "98%" as any,
    minHeight: 24,
    paddingVertical: 5,
  } as any,
  bentoBrand: {
    fontSize: 7,
    color: GOLD_SOFT,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase" as any,
  } as any,
  bentoTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    lineHeight: 20,
    marginTop: 4,
  },
  bentoSub: {
    fontSize: 7,
    color: GOLD_MUTED,
    fontStyle: "italic" as any,
    marginTop: 4,
  },
  bentoStatV: { fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: -0.5, lineHeight: 20 },
  bentoStatL: { fontSize: 6, color: GOLD_MUTED, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  bentoFoot: { fontSize: 7, color: GOLD_MUTED, fontWeight: "700", letterSpacing: 1.5 },
});
