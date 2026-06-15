#!/usr/bin/env python3
"""Generate scripts/framework_defs/full_indicators.py"""

from __future__ import annotations

import re
from pathlib import Path

OUT = Path(__file__).resolve().parent / "framework_defs" / "full_indicators.py"

OCR_FIXES = (
    ("ሇ", "ለ"), ("ዯ", "ደ"), ("ፇ", "ፈ"), ("አመሊካ", "አመሌካ"),
    ("አመሌክ", "አመሌካ"), ("ስታንዲርዴ", "ስታንዲርድ"), ("አንዯ", "አንደ"), ("መካከሇ", "መካከለ"),
    ("ዯረጃ", "ደረጃ"), ("ቼክሉስት", "ቼክ-ሊስት"), ("መስፇር", "መስፈር"), ("ሌ", "ል"),
)


def fix_am(text: str) -> str:
    for old, new in OCR_FIXES:
        text = text.replace(old, new)
    return re.sub(r"\s+", " ", text).strip()


def c(am: str, en: str) -> tuple[str, str]:
    return (am, en)


def ind(code, mp, tam, ten, sources, *criteria):
    std = int(code.split(".")[0])
    return {
        "code": code,
        "standardNumber": std,
        "maxPoints": mp,
        "titleAm": fix_am(tam),
        "titleEn": ten,
        "dataSources": list(sources),
        "criteria": [{"titleAm": fix_am(am), "titleEn": en} for am, en in criteria],
    }


# (code, maxPoints, titleAm, titleEn, sources, *criteria tuples)
RAW = [
    # === Standard 1 ===
    ("1.1", 1,
     "ትምህርት ቤቱ ተፈላጊውን የቦታ ስፊትና የይዞታ ሰነድ ምልከታ እና ቃል ማረጋገጫ ስላሟላ",
     "The school has completed verification of appropriate land area and ownership documents",
     ("DOCUMENT_REVIEW", "OBSERVATION", "INTERVIEW"),
     c("ትምህርት ቤቱ ተፈላጊ የቦታ ስፊትና የይዞታ ሰነዶች በምልከታ እና በሰነድ ማረጋገጥ ተሟልቷል",
       "Appropriate land area and ownership documents have been verified through observation and document review"),
     c("የትምህርት ቤቱ ምድር ግቢ ለአንደኛና መካከለኛ ደረጃ ትምህርት ቤት የቦታ ስፊት ቢያንስ 15,566 ካሬ ሜትር ሊኖረው ይገባል",
       "The school compound land area is at least 15,566 square metres for primary and middle level"),
     c("ቅጥር ግቢው እንደ አካባቢው ተጨባጭ ሁኔታ በድንጋይ፣ በብልጽግግ፣ በእሾህ አረንጓዴ ሽቦና በእንጨት አጥር ሙሉ በሙሉ የታጠረ",
       "The compound is fully fenced with stone, brick, eucalyptus mortar, or wooden fence as appropriate to the locality"),
     c("በትምህርት ቤቱ የይዞታ ማረጋገጫ ህጋዊ ሰነድ መኖሩ",
       "The school possesses legal documentation confirming land ownership")),
    ("1.2", 1,
     "ትምህርት ቤቱና የአካባቢው ማህበረሰብ የሚገለግለበት መሰረተ ልማቶች በስታንዲርድ መሰረት የተነቁ",
     "Community-shared infrastructure facilities are built per standard",
     ("DOCUMENT_REVIEW", "OBSERVATION", "INTERVIEW"),
     c("የቤተ-መጽሃፍት 7×24=168 ካ.ሜ፣ ከመጻሕፍት ግምጃ ቤት ጋር ብርሃንና ሰፉ የማንበቢያ ቦታ", "Library 168 sq m (7×24) with bookstore, adequate lighting and reading space"),
     c("ሁሉንም ገብ አዳራሽ 7×24=168 ካ.ሜ (መሰብሰቢያ፣ መመገቢያና ልዩ ልዩ ሁኔታዎችን ማከናወን)", "Assembly hall 168 sq m (7×24) serving collection, entry and separate functions"),
     c("የመጀመሪያ ደረጃ እርዳታ መስጫ ክፍል 7×8=56 ካ.ሜ", "First aid room 56 sq m (7×8)"),
     c("የፅዳት ሰራተኞች መሸጎጫና የፅዳት እቃዎች ማስቀመጫ ክፍል 3×3=9 ካ.ሜ", "Janitor room and cleaning supplies storage 9 sq m (3×3)"),
     c("መኖሪያ ቤት ለር/መም/ር 7×10=70 እና 7×10=70 በገጠር 140 ካ.ሜ፤ ለመምህራን 5×6=30 በደግሙ 300 ካ.ሜ", "Principal residence 70+70 sq m in rural (140 total); teachers' quarters 30 sq m each, 300 sq m total in urban"),
     c("የእግር ኳስ ሜዳ 45×90=4,050 ካ.ሜ", "Football pitch 4,050 sq m (45×90)"),
     c("የመረብ ኳስ ሜዳ 20×16=320 ካ.ሜ", "Volleyball court 320 sq m (20×16)"),
     c("የቅርጫት ኳስ 20×16=220 ካ.ሜ", "Basketball court 220 sq m (20×16)"),
     c("የእጅ ኳስ ሜዳ 20×11=220 ካ.ሜ", "Handball court 220 sq m (20×11)"),
     c("የከፍታ ዝላይ 20×15=300 ካ.ሜ", "High jump area 300 sq m (20×15)"),
     c("የትምህርት ቤቱን ስፋት መሰረት በማድረግ ሁሉንም ገብ ስፖርት መሰረተ ልማት ተዘጋጅቷል", "Full-size athletics track and field prepared based on school site dimensions"),
     c("ቤተ-መጽሃፍት፣ አዳራሽና የስፖርት ቦታዎች በስታንዲርድ መሰረት የተነቁ", "Library, hall and sports facilities built per standard")),
    ("1.3", 1,
     "የመማር ማስተማር ተግባር የሚካሄድባቸው መሰረተ ልማቶች በስታንዲርድ መሰረት የተነቁ",
     "Teaching-learning infrastructure facilities are built per standard",
     ("DOCUMENT_REVIEW", "OBSERVATION"),
     c("መማሪያ ክፍሎች ለ40 ተማሪዎች የሚበቁ 7×8=56 ካ.ሜ", "Classrooms 56 sq m (7×8) accommodating 40 students"),
     c("የመምህራን እና አስተዳደር ሰራተኞች ማረፊያ 7×8=56 ካ.ሜ", "Teachers' and admin staff room 56 sq m"),
     c("አስተዳደር ቢሮዎች ከሲሚንቶ፣ ከአሸዋ፣ ከከሰት መሰራት", "Admin offices built with cement, sand and gravel"),
     c("የር/መም/ር ቢሮ 4×5=20 ካ.ሜ", "Principal's office 20 sq m (4×5)"),
     c("የም/ር/መም/ር ቢሮ እንደ ብዛታቸው 4×5=20 ካ.ሜ", "Deputy principal office(s) 20 sq m each (4×5)"),
     c("የጸሀፊና እንግዳ መቀበያ ቢሮ 4×4=16 ካ.ሜ", "Secretary and reception office 16 sq m (4×4)"),
     c("የመምህራን እረፍት ቤት 3×6=18 ካ.ሜ", "Teachers' lounge 18 sq m (3×6)"),
     c("የትምህርት መርጃ መሳርያዎች ማከማቻና ስርጭት 4×8=32 ካ.ሜ", "Educational materials storage and distribution 32 sq m (4×8)"),
     c("የመርጃ መሳሪያዎች ማምረቻ ክፍል 4×8=32 ካ.ሜ", "Materials production room 32 sq m (4×8)"),
     c("ሪከርድና ማህደር ክፍል 4×5=20 ካ.ሜ", "Records and archive room 20 sq m (4×5)"),
     c("ለክበባት የሚሆን ክፍል 4×8=32 ካ.ሜ", "Counselling room 32 sq m (4×8)"),
     c("ለመምህራንና አስተዳደር ሰራተኞች የህፃናት ማቆያ (Day care) 4×8=32 ካ.ሜ", "Day care for teachers and admin staff 32 sq m (4×8)"),
     c("የልዩ ትምህርት ክፍል 7×8=56 ካ.ሜ", "Special needs education classroom 56 sq m (7×8)"),
     c("የሳይንስ ክፍል 7×8=56 ካ.ሜ (ከ1-6ኛ ክፍሎች ብቻ)", "Science room 56 sq m for grades 1–6 only"),
     c("ሁሉንም ገብ የሳይንስና የሂሳብ ማዕከል/ቤተ-ሙከራ 7×16=112 ካ.ሜ (7-8ኛ)", "Combined science and maths centre/lab 112 sq m (7×16) for grades 7–8"),
     c("የኢንፎርሜሽን ቴክኖሎጂ ማዕከል 7×8=56 ካ.ሜ", "IT centre 56 sq m (7×8)"),
     c("የቋንቋ ማዕከል 7×8=56 ካ.ሜ", "Language centre 56 sq m (7×8)"),
     c("እቃ ግምጃቤት 4×10=40 ካ.ሜ", "Inventory/store room 40 sq m (4×10)")),
    ("1.4", 0.5,
     "በቂ፣ ደረጃቸውን የጠበቁ፣ በየጊዜው የሚፀድና በፆታ የተለዩ የተማሪ፣ መምህርና ሰራተኞች መፀዳጃ ቤቶች ከውሃ ጋር",
     "Adequate, standard-compliant, maintained and gender-separated toilets with water supply exist",
     ("OBSERVATION", "INTERVIEW"),
     c("የተማሪ መፀዳጃ ክፍል በፆታ የተለዩ፣ 30 ሜትር ርቀት፣ 4×5=20 ካ.ሜ (ገጠር: ወ 1:75/ሴ 1:50፤ ከተማ: ወ 1:50/ሴ 1:25)", "Student toilets gender-separated, 30 m apart, 20 sq m cubicles; ratios per rural/urban standard"),
     c("መፀዳጃ ለመምህራንና ለሠራተኞች በፆታ የተለዩ 4×5=20 ካ.ሜ", "Teacher and staff toilets gender-separated, 20 sq m (4×5)"),
     c("መፀዳጃ ቤቶች ደረጃቸውን የጠበቁ፣ በየጊዜው የሚፀድኑ እና ከውሃ ጋር", "Toilets meet standard, are regularly cleaned and have water supply")),
    ("1.5", 0.5,
     "ትምህርት ቤቱ በቂ ለመጠጥ የሚያገለግል የውሃ አቅርቦት", "The school has adequate drinking water supply",
     ("OBSERVATION", "INTERVIEW"),
     c("ገጠር: 100 ተማሪዎች አንዴ ቧንቧ፤ ከተማ: 50 ተማሪዎች አንዴ ቧንቧ", "Rural: one tap per 100 students; urban: one tap per 50 students")),
    ("1.6", 1,
     "ትምህርት ቤቱ ለህብረተሰቡ ስራ ማሳያ የሚያገለግሉ መሰረተ ልማቶች የተነቁ",
     "Community demonstration infrastructure is built per standard",
     ("OBSERVATION", "INTERVIEW"),
     c("ለ7ኛና 8ኛ የእንጨትና ብረታ ብረት ስራ ማሳያ ክፍል 7×8=56 ካ.ሜ", "Wood and metal workshop 56 sq m for grades 7–8"),
     c("የእድ ጥበብና የእጅ ስራዎች ክፍል 7×8=56 ካ.ሜ", "Fine arts and handicrafts room 56 sq m"),
     c("ገጠር ቢያንስ 120 ካ.ሜ፤ ከተማ 60 ካ.ሜ የጓሮ/አትክልት መትከያ", "Garden plot: min 120 sq m rural, 60 sq m urban with plantation"),
     c("ስራ ማሳያ ክፍሎች ምቹ፣ ብርሃን 300-500 lux፣ አየር ማስተላለፊያና ቆሻሻ ማስወገጃ", "Workshops convenient with 300–500 lux lighting, ventilation and waste disposal")),
]

# Standards 2-28 indicator data
RAW_REST = []

def add(code, mp, tam, ten, src, *crits):
    RAW_REST.append((code, mp, tam, ten, src) + crits)

# Standard 2
add("2.1", 1, "ትምህርት ቤቱና የአካባቢው ማህበረሰብ የሚገለግለበት (ቤተ-መጽሃፍት፣ ሁሉንም ገብ አዳራሽ፣ የስፖርት ቦታዎች) ቁሳቁሶች በስታንዲርድ መሰረት ተሟሉ",
    "Materials for community-shared facilities meet the standard", ("OBSERVATION","INTERVIEW"),
    c("ቤተ-መጽሃፍት ቢያንስ 40 የተማሪ መቀመጫ ወንበር","Library has at least 40 student seats"),
    c("ቤተ-መጽሃፍት ቢያንስ 7 ጠረጴዛዎች","Library has at least 7 desks"),
    c("ቤተ-መጽሃፍት ቢያንስ 1 ኮምፒውተር","Library has at least 1 computer"),
    c("ቤተ-መጽሃፍት የባibliography ወንበር","Library has a reference bench"),
    c("ቤተ-መጽሃፍት የባibliography ጠረጴዛ","Library has a reference desk"),
    c("መጽሐፍ መደርደሪያ ቢያንስ 5","At least 5 book shelves per student ratio"),
    c("የተማሪ መማሪያ መጽሐፍት ከየትምህርት ዓይነት ቢያንስ 5","At least five textbooks per subject"),
    c("ማጣቀሻ መጽሐፍ ቢያንስ ለ1 ተማሪ 5","At least five reference books per student"),
    c("ሁሉንም ገብ አዳራሽ አስፈላጊ ወንበሮችና ጠረጴዛዎች","Assembly hall has adequate chairs and desks"),
    c("የስፖርት ኳሶች በስታንዲርድ","Sport balls meet standard"),
    c("የአትላቲክስ መሳሪያ ቁሳቁሶች","Athletics equipment complete"),
    c("የጅምናስቲክ መሳሪያ ቁሳቁሶች","Gymnastics equipment complete"),
    c("የሜዳ ቁሳቁሶች ተሟልተዋል","Track equipment complete"))

add("2.2", 1, "ት/ቤቱ የመማሪያ፣ የቤተ-ሙከራዎች፣ የመምህራን ማረፊያ፣ መመገቢያ አዳራሽ እና አስተዳደር ክፍሎችን አስፈላጊ ቁሳቁሶችን አሟላ",
    "Teaching, lab, staff lounge, assembly and admin rooms have adequate materials", ("OBSERVATION","INTERVIEW","DOCUMENT_REVIEW"),
    c("መማሪያ ክፍል በ1 ዳስክ 2 ተማሪዎች 20 አርምቸር 40","Classroom: 20 armchairs and 40 seats at 1 desk per 2 students"),
    c("ለመምህሩ ጠረጴዛ","Teacher desk provided"), c("ለመምህሩ ወንበር","Teacher chair provided"),
    c("ጥቁር ወይም ነጭ ሰላዲ","Blackboard or whiteboard in both cycles"),
    c("የተማሪ መጽሐፍት 1:1","Student textbooks 1:1 ratio"),
    c("ለቤተ-ሙከራ የተማሪዎች ረጅም ወንበር 40","Lab long benches for 40 students"),
    c("ለቤተ-ሙከራ Stool 40","Lab stools for 40 students"),
    c("የመምህሩ ስራ ማሳያ ጠረጴዛ","Teacher demonstration desk"),
    c("ቁምሳጥን ክሊፕ እና ከታች ብዛት","Test tube clips and stands"),
    c("ሲንክ ያላቸው የሙከራ ጠረጴዛዎች (7-8)","Lab tables with sinks for grades 7-8"),
    c("የመምህራን ማረፊያ ጠረጴዛ","Teachers' lounge tables"),
    c("የት/ቤት የውስጥ መዝናኛ: ቼዝ፣ ቴብሌ ቴ�nis","Recreation: chess, table tennis"),
    c("መምህራን ላንች በመምህር ቁጥር","Teacher lockers per teacher count"),
    c("ሁሉንም ገብ አዳራሽ በአስፈላጊ ቁሳቁሶች ተሟሊ","Assembly hall fully equipped"),
    c("አስተዳደር ቢሮዎች ተሟልተዋል","Admin offices equipped per standard"),
    c("ቤተ-መዘክር ተሟሊ","Archive room equipped"),
    c("እቃ ግምጃቤት: መደገፊያ ወንበር፣ እንግዳ ወንበር፣ ጠረጴዛ፣ ፋይል ካቢኔት","Store room: bench, guest chair, desk, filing cabinet"),
    c("የመጀመሪያ ህክምና ክፍል ቁሳቁሶች","First aid room materials per standard"))

add("2.3", 1, "ትምህርት ቤቱ ለህብረተሰቡ ለስራ ማሳያ የሚያገለግሉ ቁሳቁሶችን አሟላ",
    "Community demonstration materials are complete", ("OBSERVATION","INTERVIEW"),
    c("የእርሻ መሳሪያ ግብዓት ተሟሊ","Agriculture inputs complete"),
    c("የእርባታ መሳሪያ ግብዓት ተሟሊ","Horticulture inputs complete"),
    c("የእድ ጥበብ ስራ ማሳያ ግብዓቶች","Fine arts workshop materials complete"),
    c("የእንጨትና ብረታ ብረት ግብዓት ተሟሊ","Wood and metal workshop materials complete"))

# Standard 3
add("3.1", 1, "በት/ቤቱ የሚገኙ የውስጥ-ለውስጥ መንገዶች ለሁለም ተማሪዎች ምቹ ናቸው",
    "Internal pathways are convenient for all students", ("OBSERVATION",),
    c("የመንገዶች አቀማመጥ ከቦታ ለመንቀሳቀስ አመቺ","Path layout allows easy movement"),
    c("የውስጥ-ለውስጥ እና የመግቢያ/መውጫ መንገዶች ምቹ","Internal and entry/exit paths are convenient"))

add("3.2", 1, "የትምህርት ቤቱ አካባቢ ከአደጋ ጉዳiyot ነፃ ነው",
    "The school environment is free from hazards", ("OBSERVATION","INTERVIEW"),
    c("ከዋና መንገድ እና ከፍተኛ ትራፊክ ፍሰት የራቀ","Away from main road and heavy traffic"),
    c("ከወንዞች፣ ገደሎች፣ ገበያና ፋብሪካ የራቀ","Away from rivers, gullies, markets and factories"),
    c("ከአደጋ ድምፅ፣ ጫጫታ፣ መጥፎ ጃሪና መጠጥ ቤት የራቀ","Away from noise, quarries, bad odour and bars"),
    c("ከቪዲዮ ቤት፣ ጫት/ሺሻ ቤት የራቀ","Away from video halls and chat/shisha houses"),
    c("ት/ቤቱ ከተማሪ መኖሪያ 2 ኪ.ሜ በማይበልጥ","Within 2 km of student residences"),
    c("ት/ቤቱ ለልዩ ፍላጎት ተማሪዎች ምቹ መንገድ አለው","Convenient internal paths for special needs students"))

# Standard 4
add("4.1", 1, "ትምህርት ቤቱ ልዩ የመማር ፍላጎት ላላቸው ተማሪዎች ምቹ ሁኔታ ፈጥሯል",
    "Convenient conditions exist for learners with special needs", ("INTERVIEW","OBSERVATION"),
    c("በስታንዲርድ መሰረት የመስማት/ማየት/አካል ጉዳት ቁሳቁስ","Materials for sensory and physical disability per standard"),
    c("ለአካል ጉዳተኞች ምቹ መፀዳጃ","Convenient toilets for students with physical disabilities"),
    c("ልዩ ፍላጎት ክፍል በቁሳቁስ ተሟሊ","Special needs classroom equipped per standard"))

add("4.2", 1, "ትምህርት ቤቱ ለሴት ተማሪዎች ምቹ ሁኔታ ፈጥሯል",
    "Convenient conditions exist for female students", ("INTERVIEW","OBSERVATION"),
    c("የሴቶች የንፅህና መጠበቂያ ክፍል በስታንዲርድ ተሟሊ","Girls' hygiene room equipped per standard"))

# Standard 5
add("5.1", 1, "ትምህርት ቤቱ የእውቀት ሀብት የሚያሰባስብበት እቅድ አዘጋጅቷል",
    "The school has prepared a plan to mobilize financial resources", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ት/ቤቱ በስትራቴጂና አመታዊ እቅድ የእውቀት ሀብት ማሰባሰብ ታቅዷል","School plan includes resource mobilization"))

add("5.2", 2, "በትምህርት ቤቱ ቅድሚያ ትኩረት የሚሹ ጉዳዮች በበጀት ተደገፈዋል",
    "Priority issues are supported in the budget", ("DOCUMENT_REVIEW",),
    c("ትምህርት ቤቱ ቅድሚያ ትኩረት ጉዳዮችን አይቷል","Priority issues identified"),
    c("ቅድሚያ ጉዳዮች በበጀት ተደገፈዋል","Priority issues supported in budget"))

# Standard 6
add("6.1", 1, "ትምህርት ቤቱ ለደረጃው የሚመጥን የትምህርት ዝግጅት ያላቸው መምህራን አሟላ",
    "Teachers with appropriate qualifications are in place", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("መምህራን ዱፕሊኬት አልያቸው","No duplicate teacher assignments"),
    c("መምህራን የሙያ ማስክታፈርያ አላቸው","Teachers hold professional certification"),
    c("ልዩ ፍላጎት መምህር በዱፕሊኬት","Special needs teacher not duplicated"),
    c("አዋጋ የልዩ ፍላጎት መምህር በዱፕሊኬት ተመረቀ","Assistant special needs teacher qualified"),
    c("የተማሪ-መምህር ጥምርታ 1:40","Student-teacher ratio is 1:40"),
    c("መምህራን ቁጥር በስታንዲርድ","Teacher numbers meet standard"))

add("6.2", 1, "ትምህርት ቤቱ ለደረጃው የሚመጥን የትምህርት ዝግጅት ያላቸው አመራሮች አሟላ",
    "School leaders with appropriate qualifications are in place", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ር/መምህር የመጀመሪያ ዲግሪ እና የአመራር ስልጠና","Principal has first degree and leadership training"),
    c("ም/ር/መምህር የመጀመሪያ ዲግሪ እና የአመራር ስልጠና","Deputy has first degree and leadership training"),
    c("ሱፐርቫይዘር የመጀመሪያ ዲግሪ እና የአመራር ስልጠና","Supervisor has first degree and leadership training"),
    c("በትምህርት አመራር የሙያ ማስክታፈርያ","Leadership staff hold professional certification"),
    c("አመራሮች ቁጥር በስታንዲርድ","Leadership numbers meet standard"))

add("6.3", 1, "ትምህርት ቤቱ ለደረጃው የሚመጥን የአስተዳደር ሰራተኞችን አሟላ",
    "Administrative staff with appropriate qualifications are in place", ("DOCUMENT_REVIEW",),
    c("ጥበቃ 8ኛ ክፍል ያጠናቀቀ","Security staff completed grade 8"),
    c("የፅዳት ሰራተኛ 8ኛ ክፍል ያጠናቀቀ","Janitor completed grade 8"),
    c("ንብረት/IT ባለሙያ IT ዲፕሎማ","Property/IT staff with IT diploma"),
    c("አስተዳደር ሰራተኞች ቁጥር በስታንዲርድ","Admin staff numbers meet standard"))

add("6.4", 1, "ትምህርት ቤቱ ተማሪዎችን በደረጃ መደበለ",
    "Students are assigned per grade standard", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ተማሪ ከ1-8 በክፍል እስከ 40","Grades 1-8 have up to 40 students per class"),
    c("በልዩ ክፍል አንድ መምህር 10-20 ተማሪ","Special class: one teacher for 10-20 students"))

# Standard 7 merged
add("7.1", 1, "አመራሩ የትምህርት ቤት ግምገማ አካሂዷል እና የሦስት ዓመት ስትራቴጂክ እና አመታዊ የመሻሻያ እቅድ አዘጋጅቷል",
    "Leader conducted self-assessment and prepared strategic and annual improvement plans", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የትምህርት ቤት መሻሻያ ኮሚቴ ተቋቋመ","School improvement committee established"),
    c("የግምገማ መካሄድ የሚያሳዩ ሂደቶች ተደራጁ","Self-assessment process records organized"),
    c("መምህራንና ባለሙያዎች በእቅድ ዝግጅት ተሳትፈዋል","Teachers and experts participated in plan preparation"),
    c("እቅዱ ግብረ-መልስና ግምገማ ውጤቶችን ያካትታል","Plan incorporates feedback and assessment results"))

# Standard 8
add("8.1", 1, "ከትምህርት ቤት መሻሻያ ጋር ተያይዘው የሚመጡ የለውጥ ስራዎችን በአግባቡ አመራሩ ይመራል",
    "Leader appropriately manages innovation aligned with school improvement", ("INTERVIEW",),
    c("ት/ቤቱ አዲስ አሰራሮችን በመቀበል የእቅድ አካላት አድርጓል","School adopted new practices as plan pillars"),
    c("ት/ቤቱ የእቅድ አካላትን ተግባራዊ አድርጓል","School implemented plan pillars"))

add("8.2", 1, "አመራሩ በትምህርት ቤቱ ዋና ተግባራትን በወቅቱ ያስተላልፋል",
    "Leader communicates major school activities on time", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የትምህርትቤቱን ስትራቴጂና አመታዊ እቅድ በተያዘ ጊዜ ማስተዋወቅ","Strategy and annual plan communicated on schedule"),
    c("የተማሪዎች ውጤትና ስነ-ምግባር ማስተዋወቅ","Student results and conduct communicated"),
    c("የገቢና ወጪ ሒሳብ ማስተዋወቅ","Income and expenditure accounts communicated"))

add("8.3", 1, "የትምህርት ቤቱ አመራር መልካም ልምዶችን ቀምሮ ተግባራዊ አድርጓል",
    "Leadership adopted and implemented good practices", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የተቀሰመ ልምድና እውቀት አለ","Adopted practice and knowledge documented"),
    c("የተቀመረና ተግባራዊ የተደረገ ሰነድ አለ","Adopted practice documented and implemented"))

add("8.4", 1, "አመራሩ እና ማህበረሰቡ ICT የተደገፈ የአሰራር ስርዓት ፈጥረዋል",
    "Leader and community created ICT-supported communication system", ("OBSERVATION","INTERVIEW"),
    c("የተፈጠረ የቴክኖሎጂ የግንኙነት ስርዓት አለ","Technology communication system exists"),
    c("ጥቅም ላይ የሚውል መረጃ አለ","Evidence of effective use exists"))

# Standard 9
add("9.1", 1, "አመራሩ የአቅም ግንባታ መርሃ-ግብር አውጥቶ ተግባራዊ አድርጓል",
    "Leader developed and implemented capacity-building program", ("DOCUMENT_REVIEW",),
    c("ለመምህራንና ለራሱ የአቅም ግንባታ መርሃ-ግብር አለ","Capacity-building program for teachers and self exists"),
    c("የተሰጡ የአቅም ግንባታ ስልጠናዎች መረጃ አለ","Training records documented"))

add("9.2", 1, "የአስተዳደር ሰራተኞችን ሙያዊ ማሻሻያ ተግባራት ተከናውኗል",
    "Professional development for admin staff implemented", ("DOCUMENT_REVIEW",),
    c("ለአስተዳደር ሰራተኞች የአቅም ግንባታ መርሃ-ግብር አለ","Capacity program for admin staff exists"),
    c("የተሰጡ የአቅም ግንባታ ስልጠናዎች መረጃ","Training records documented"))

add("9.3", 1, "አመራሩ ከዩኒቨርሲቲ፣ ኮሌጅ እና ኢንዱስትሪ ጋር ትስስር ፈጥሮ ድጋፍ አግኝቷል",
    "Leadership linked with universities, colleges and industry for support", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ት/ቤቱ የትስስር ስርዓት ዘርግቷል","School linkage system established"),
    c("በተፈጠረ ትስስር የአቅም ግንባታ ድጋፍ አግኝቷል","Capacity support obtained through linkage"))

# Standard 10
add("10.1", 0.5, "የት/ቤቱ አመራር ኮሚቴዎችን በማደራጀት ተግባርና ኃላፊነት አውረደ",
    "Leadership organized committees and delegated responsibilities", ("DOCUMENT_REVIEW",),
    c("ኮሚቴዎችን በመፍጠር የስራ ድልድል አድርጓል","Work delegation through committees established"))

add("10.2", 1, "የተሰጠ ተግባርና ኃላፊነት አፈጻጸም ተደገፈ ተከታተለ እና ግብረ-መልስ ተሰጠ",
    "Committee performance supported, monitored and given feedback", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የመከታተያ ቼክ-ሊስት ተዘጋጅቷል","Monitoring checklist prepared"),
    c("በተያዘ እቅድ መሰረት ድጋፍ ተሰጠ","Support provided per plan"),
    c("ግብረ-መልስ ተሰጠ","Feedback provided"))

add("10.3", 1, "የትምህርት ቤት መሻሻያ ኮሚቴ እቅድ አፈጻጸም ተከታተለ",
    "School improvement committee plan performance monitored", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የመሻሻያ ኮሚቴ የእቅድ አፈጻጸም ሪፖርቶች አሉ","Improvement committee performance reports exist"),
    c("የተሰጡ ግብረ-መልሶችና የተሻሻሉ ጉዳዮች አሉ","Feedback and improved issues documented"))

add("10.4", 0.5, "አመራሩ ማህበረሰብ የሚያሳትፍ የችግር መፍቻ ስርዓት ዘርግቷል",
    "Leader established inclusive problem-solving system", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ማህበረሰቡ በውሳኔ አሰጣጥ ሂደቶች ተሳትፏል","Community participated in decision-making"),
    c("መምህራን በአመራር ሥራዎች ተሳትፈዋል","Teachers actively participate in leadership"),
    c("መምህራንና ባለሙያዎች በግምገማ ተሳትፈዋል","Teachers and experts participated in assessment"),
    c("ወላጆች በዓመት ቢያንስ ሶስት ጊዜ ተጠራተው ውይይት ተካሄደ","Parents convened at least three times yearly"),
    c("ወላጆች የባለቤትነት ስሜት አላቸው","Parents have sense of ownership"))

# Standard 11
add("11.1", 1, "አመራሩ የውስጥ ሱፐርቪዥን ስርዓት በመዘርጋት ለመምህራን ሙያዊ ድጋፍ ሰጥቷል",
    "Leader provides professional support through internal supervision", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የተዘረጋ የውስጥ ሱፐርቪዥን ስርዓት አለ","Internal supervision system established"),
    c("በተመጣጣኝ መጠን የሱፐርቪዥን ድጋፍ ተሰጠ","Proportional supervision support provided"))

add("11.2", 1, "መምህራን ከ75% በላይ የክፍል ውስጥ ምልከታ እርስ በርስ ያደርጋሉ",
    "Teachers conduct peer classroom observation at least 75%", ("OBSERVATION","DOCUMENT_REVIEW"),
    c("መምህራን በሴሚስተር ሶስት ጊዜ የዕርስ በርስ ሱፐርቪዥን ድጋፍ አድርገዋል","Teachers peer-supervised three times per semester"))

add("11.3", 1, "መምህራን ተከታታይ ምዘና እና ግብረ-መልስ መስጠታቸውን ደገፈ",
    "Teachers supported continuous assessment and feedback", ("DOCUMENT_REVIEW",),
    c("የተከታታይ ምዘና መከታተያ ቼክ-ሊስት ተዘጋጅቷል","Continuous assessment tracking checklist prepared"),
    c("የተሰጠ ድጋፍና ግብረ-መልስ በመረጃ ተመዝግቧል","Support and feedback documented"))

add("11.4", 1, "የመምህራንና ተማሪዎችን የአመራር ክህልት ለማሳደግ ስርዓት ተግባራዊ ሆኗል",
    "Leadership skill development system for teachers and students implemented", ("OBSERVATION","DOCUMENT_REVIEW"),
    c("ተማሪዎች የአመራር ክህልት ለማሳደግ አሰራር ተግባራዊ ሆኗል","Student leadership development operational"),
    c("በክouncelling፣ ክፍሎች፣ ኮሚቴዎች ተሳትፈው ክህልታቸው ይሳደጋል","Participation in counselling, classes and committees develops competence"))

# Standard 12
add("12.1", 1, "የት/ቤቱ አመራር ስኬታማ ግለሰቦችን በመጋበዝ ሙያዊ ተሞክሮዎችን እንዲያካፍሉ አድርጓል",
    "Leadership invited successful professionals to share experience", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ስኬታማ ግለሰቦችን በመጋበዝ ሙያዊ ተሞክሮዎችን እንዲያካፍሉ ተደርጓል","Successful professionals invited to share experience"))

add("12.2", 1, "ለመምህራን ምቹ የስራ አካባቢ ተፈጥሯል",
    "Convenient work environment created for teachers", ("OBSERVATION",),
    c("ለመደበኛ የሚያገለግሉ ስፍራዎች ተመቻችተዋል","Regular workspaces arranged"),
    c("በግብዓት ተሟልተዋል","Resources are adequate"))

add("12.3", 1, "የተሻለ አፈጻጸም ያላቸው መምህራን የሚበረታቱበት ግብርና ስርዓት ተግባራዊ ሆኗል",
    "Merit recognition system for high-performing teachers implemented", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የሚበረታቱበት የተዘረጋ ግብርና ሥርዓት አለ","Merit recognition system established"),
    c("የተሻለ አፈጻጸም ያላቸው መምህራንን የማበረታታት ስራ ተሰርቷል","Recognition of high-performing teachers underway"))

add("12.4", 1, "ሁሉም መምህራን በእኩልነት/ውሳኔ ሰጪነት የሚሳተፉበት ስርዓት ተግባራዊ ሆኗል",
    "System for equal/decision-making participation of all teachers implemented", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("መምህራን በእኩልነት የሚሳተፉበት ስርዓት ተዘርግቷል","Equal participation system established"),
    c("በተዘረጋው ሥርዓት መሰረት ተግባራዊ ተደርጓል","System implemented in practice"))

# Standard 13
add("13.1", 0.5, "ሁሉም መምህራን በሰለጠኑበት የሙያ መስክ ተመድበዋል",
    "All teachers assigned in their trained subject field", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ሁሉም መምህራን በሰለጠኑበት የት/ት ዓይነት ተመድበዋል","All teachers assigned to trained subject"))

add("13.2", 0.5, "ሁሉም የአስተዳደር ሰራተኞች በሰለጠኑበት የሙያ መስክ ተመድበዋል",
    "All admin staff assigned in their trained field", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ሁሉም አስተዳደር ሰራተኞች በሰለጠኑበት የት/ት ዓይነት ተመድበዋል","All admin staff assigned to trained field"))

add("13.3", 1, "መምህራንና አስተዳደር ሰራተኞች በስራ ቦታ እና ሰዓት ተገኝተው ኃላፊነታቸውን ይወጣሉ",
    "Staff present at workplace and fulfill responsibilities", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የክትትል ስርዓት ተዘርግቷል","Monitoring system established"),
    c("ኃላፊነት መወጣት የሚያሳይ ቅንጅታዊ አሰራር አለ","Organized work showing accountability exists"))

add("13.4", 1, "የተጠያቂነት አሰራርና ስርዓት ተግባራዊ ሆኗል",
    "Accountability system implemented", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የተጠያቂነት አሰራርና ሥርዓት ተዘርግቷል","Accountability system established"),
    c("የተወሰዱ እርምጃዎች አሉ","Corrective actions taken"))

# Standard 14
add("14.1", 1, "የተሰበሰበውን የፊይናንስ ሀብት ቅድሚያ ተግባራት ላይ ተዋል",
    "Mobilized financial resources allocated to priority activities", ("DOCUMENT_REVIEW",),
    c("በትምህርት ቤቱ የፊይናንስ ድህረ-መዝገብ/ገቢ-ወጪ/ሚዛን አለ","School has income-expenditure-balance records"),
    c("የተገኘ ሀብት ቅድሚያ ትኩረት ለሚገባው ተግባር ተዋለ","Resources allocated to priority activities"))

add("14.2", 0.5, "አመራሩ ቁሳቁስና መሰረተ ልማት በአግባቡ አስተዳድሯል",
    "Leader appropriately manages assets and infrastructure", ("DOCUMENT_REVIEW",),
    c("ቁሳቁስና መሰረተ ልማት የሚተዳደሩበት ስርዓት ተዘርግቷል","Asset management system established"),
    c("በተዘረጋ ሥርዓት መሰረት ሀብት ተከናውኗል","Resources managed per established system"),
    c("ለቁሳቁሶችና መሰረተ ልማቶች ወቅታዊ ጥገናና እድሳት ተደርጓል","Timely maintenance and renewal conducted"))

add("14.3", 0.5, "የንብረትና ፊይናንስ ቁጥጥር ስርዓት ተግባራዊ ሆኗል",
    "Property and financial control system implemented", ("DOCUMENT_REVIEW",),
    c("የንብረት ርክክብ መረጃዎች ተደራጅተው ተይዘዋል","Property balance records organized and maintained"),
    c("የንብረት ቆጠራ/ኦዲት መረጃዎች ተደራጅተው ተይዘዋል","Asset audit records organized and maintained"),
    c("ወቅታዊ የፊይናንስ ኦዲት ስራ ተከናውኗል","Current financial audit work conducted"),
    c("በእቅድ መሰረት School report card ለማህበረሰቡ ተዘጋጅቷል","Community school report card prepared per plan"))

# Standard 15
add("15.1", 0.5, "ተማሪዎች የትምህርት ቁሳቁሶችን አሟሉተው ለትምህርት ዝግጁ ናቸው",
    "Students are ready for learning with complete materials", ("OBSERVATION","INTERVIEW"),
    c("ተማሪዎች ዩኒፎርም ለብሰው ይገኛሉ","Students attend in uniform per regulation"),
    c("ተማሪዎች የመማሪያ ቁሳቁሶችን አሟሉተዋል","Students have complete learning materials"),
    c("ተማሪዎች ቁሳቁሶችን በክፍል ውስጥ እየተጠቀሙበት","Students use materials in class"))

add("15.2", 0.5, "ተማሪዎች በሰዓቱ በትምህርት ቤትና በክፍል ውስጥ ይገኛሉ",
    "Students attend school and class on time", ("OBSERVATION","DOCUMENT_REVIEW"),
    c("ተማሪዎች በሰዓቱ በትምህርት ቤት ቅጥር ግቢ ይገኛሉ","Students present in compound on time"),
    c("ተማሪዎች በሰዓቱ በክፍል ውስጥ ይገኛሉ","Students present in class on time"))

add("15.3", 0.5, "ተማሪዎች በክፍል ውስጥና ውጭ ተግባራትን በንቃት ይሳተፋሉ",
    "Students actively participate in in-class and out-of-class activities", ("OBSERVATION","INTERVIEW"),
    c("ተማሪዎች የክፍልና የቤት ስራ በየጊዜው ይሰራሉ","Students do class and homework regularly"),
    c("በጥንድ የሚያከናውኑት ስራዎች ይሰራሉ","Students complete pair work"),
    c("የቡድን ስራዎች ይሰራሉ","Students complete group work"),
    c("በቤተ-ሙከራ ሥራ ይሳተፋሉ","Students participate in lab work"))

add("15.4", 1, "ተማሪዎች ጥያቄዎችን መጠየቅና መልስ መስጠት ይሳተፋሉ",
    "Students participate in asking and answering questions", ("OBSERVATION",),
    c("ተማሪዎች አሳታፋዊ የመማር-ማስተማር ተግባር ተፈጥሯል","Participatory teaching-learning exists"),
    c("ተማሪዎች በክፍል ውስጥና ውጭ በንቃት ይሳተፋሉ","Students actively participate in and out of class"))

add("15.5", 0.5, "ተማሪዎች በተለያዩ ክበባት በንቁ ተሳትፈዋል",
    "Students actively participate in organized clubs", ("OBSERVATION","DOCUMENT_REVIEW"),
    c("በመመሪያው መሰረት ክበባት ተደራጀ","Clubs organized per directive"),
    c("ተማሪዎች በተጓዳኝ ክበባት ንቁ ተሳትፈዋል","Students actively participate in relevant clubs"))

add("15.6", 1, "ተማሪዎች አዲስ ነገር መፍጠርና ችግር መፍታት ይሞክራሉ",
    "Students attempt innovation and problem-solving", ("OBSERVATION","INTERVIEW"),
    c("ተማሪዎች በራስ-ተነሳሽነት የፈጠራ ስራዎችን ይሰራሉ","Students do creative work independently"),
    c("የተማሪዎች የፈጠራ ስራዎች አሉ","Student creative works exist"),
    c("የፈጠራ ስራዎች ችግር-ነፃ እንዲሆኑ ጥረት ተደርጓል","Efforts made to keep creative work problem-free"))

add("15.7", 1, "ተማሪዎች የስራና ተግባር ትምህርትን በስራ ማሳያ ክፍል ይጠቀማሉ",
    "Students use work education in demonstration workshops", ("OBSERVATION",),
    c("ትምህርት ቤቱ ስራ ማሳያዎች አዘጅቷል","School prepared demonstration workshops"),
    c("ት/ቤቱ የማምረቻ ስፍራዎችን በመጠቀም ወደ ተግባር ገብቷል","School uses production spaces operationally"),
    c("የእድ ጥበብና የእጅ ሥራዎች ተከናውኗል","Fine arts and handicrafts conducted"),
    c("የእርሻ ስራዎች ተከናውኗል","Agriculture work conducted"),
    c("የብረታ ብረትና የእንጨት ሥራዎች ተከናውኗል","Metal and wood work conducted"))

# Standard 16
add("16.1", 1, "መምህራን የተማሪዎችን አቀራ-ባሌ መሰረት በማድረግ የትምህርት እቅድ በአግባቡ አዘጅተዋል",
    "Teachers adequately plan lessons based on student context", ("OBSERVATION","DOCUMENT_REVIEW"),
    c("መምህራን የትምህርት እቅድ አዘጅተዋል (አመታዊ፣ ወርሃዊ፣ ሳምንታዊ፣ ቀደሃዊ)","Teachers prepare lesson plans (annual, monthly, weekly, daily)"),
    c("የትምህርት እቅድ አላማ፣ ይዘትና ተግባር ያካትታል","Plan includes objectives, content and roles"),
    c("ቀደሃዊ እቅድ የምዘና ጥያቄዎችን በዝርዝር ያካትታል","Daily plan includes detailed assessment questions"))

add("16.2", 1, "መምህራን የምዘና ዘዴ እና መርጃ መሳሪያዎችን በእቅድ ውስጥ ቀድተዋል",
    "Teachers plan assessment methods and teaching aids", ("OBSERVATION","DOCUMENT_REVIEW"),
    c("በመምህር እቅድ የምዘና ዘዴ ተካቷል","Assessment method included in teacher plan"),
    c("በመምህር እቅድ መርጃ መሳሪያዎች ተካተዋል","Teaching aids included in teacher plan"))

# Standard 17
add("17.1", 0.5, "መምህራን ተማሪዎችን በጥንድ፣ በቡድን እና በግል አሳታፋዊ ዘዴዎችን ይጠቀማሉ",
    "Teachers use pair, group and individual participatory methods", ("OBSERVATION",),
    c("መምህራን አሳታፋዊ የማስተማር ዘዴዎችን ይቀይራሉ","Teachers vary participatory teaching methods"),
    c("መምህራን አሳታፋዊ ዘዴዎችን ይተገብራሉ","Teachers implement participatory methods"))

add("17.2", 0.5, "መምህራን ቴክኖሎጂ (ሬዲዮ፣ ቴሌቪዥን፣ ኮምፒውተር) በመጠቀም ትምህርት ይሰጣሉ",
    "Teachers use technology in teaching", ("OBSERVATION",),
    c("በትምህርት ቤቱ ICT አገልግሎት አለ","ICT service available in school"),
    c("መምህራን ትምህርት በዘመናዊ ቴክኖሎጂ ይሰጣሉ","Teachers use modern technology in lessons"))

add("17.3", 0.5, "መምህራን መርጃ መሳሪያዎችን በማዘጋጀት ጥቅም ላይ ይውላሉ",
    "Teachers prepare and use teaching aids", ("OBSERVATION",),
    c("መምህራን መርጃ መሳሪያዎችን ያዘጋጃሉ","Teachers prepare teaching aids"),
    c("መምህራን የትምህርት ቤቱን መርጃ መሳሪያዎችም ይጠቀማሉ","Teachers also use school-provided aids"))

add("17.4", 0.5, "መምህራን ሳይንስ ኪት፣ ቤተ-ሙከራ እና Workshop በመጠቀም ትምህርት ይሰጣሉ",
    "Teachers use science kits, labs and workshops", ("OBSERVATION",),
    c("መምህራን ሳይንስ ኪት/ቤተ-ሙከራ ይጠቀማሉ","Teachers use science kits/labs"),
    c("መምህራን መስክ ምልከታ ይጠቀማሉ","Teachers use field observation"),
    c("መምህራን Workshop ይጠቀማሉ","Teachers use workshops"))

add("17.5", 0.5, "መምህራን ተማሪዎችን የፈጠራ/ሳይንስ ስራ እንዲሰሩ ያበረታታሉ",
    "Teachers encourage creative/science project work", ("OBSERVATION",),
    c("መምህራን ተማሪዎችን በአካባቢ ቁሳቁስ የፈጠራ ስራ እንዲሰሩ ያበረታታሉ","Teachers encourage local-material creative work"),
    c("በተማሪዎች የፈጠራ ስራዎች ተገቢነት ተመቻችቷል","Student creative work appropriately facilitated"))

add("17.6", 0.5, "መምህሩ ባለሙያዎችን በመጋበዝ በመማር-ማስተማር ሂደት ይሳተፋል",
    "Teacher invites experts into teaching-learning", ("OBSERVATION","DOCUMENT_REVIEW"),
    c("መምህራን ባለሙያ አካላትን ይለይላሉ","Teachers identify relevant experts"),
    c("መምህራን ባለሙያዎችን በትምህርት ይሳትፋሉ","Teachers involve experts in lessons"))

add("17.7", 1, "መምህራን ችግሮችን ለመፍታት ተግባራዊ ጥናት/ምርምር ያካሂዳሉ",
    "Teachers conduct action research to solve problems", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("መምህራን ችግሮችን ለመፍታት ጥናት/ምርምር ያካሂዳሉ","Teachers conduct research to solve problems"),
    c("ምቹ ሁኔታዎች ተፈጥረዋል","Conducive conditions created"),
    c("መምህራን ችግሮችን ለመፍታት ጥናት/ምርምር አካሂደዋል","Teachers have conducted action research"),
    c("የጥናቱ ግኝት በትምህርት ቤት ደረጃ ተግባር ላይ ገብቷል","Research findings applied at school level"),
    c("መምህራን ጥረት አድርገዋል","Teachers made effort"),
    c("ጥናቱ ተግባራዊ ሆኗል","Research is operational"))

add("17.8", 1, "መምህራን ትምህርት ይዘትንና ቁልፍ ጽንሰ-ሀሳቦችን በተገቢ ቋንቋ ያቀርባሉ",
    "Teachers present content and key concepts in appropriate language", ("OBSERVATION",),
    c("መምህራን ይዘትና ቁልፍ ሀሳቦችን በተገቢ ቋንቋና አቀራ-ባሌ ያቀርባሉ","Teachers present content in appropriate language and approach"))

# Standard 18
add("18.1", 1, "መምህራን ምዘናን በስርዓተ-ትምህርት እና Table of Specifications መሰረት ያዘጋጃሉ",
    "Teachers prepare assessment based on curriculum and table of specifications", ("DOCUMENT_REVIEW","OBSERVATION"),
    c("መምህራን በTable of Specifications ግንዛቤ አላቸው","Teachers understand table of specifications"),
    c("መምህራን ምዘና ስርዓተ-ትምህርትን መሰረት ያደረገ","Assessment based on curriculum"),
    c("መምህራን ምዘና በTable of Specifications መሰረት","Assessment based on table of specifications"),
    c("በትምህርት ክፍሎች የሚዘጋጁ ምዘናዎች ተገምግመዋል","Class assessments reviewed"),
    c("ምዘናዎች ተመሳሳይነት አላቸው","Assessments are consistent"))

add("18.2", 1, "መምህራን ተማሪዎችን በMLC መሰረት ተከታታይ ምዘና ይሰጣሉ",
    "Teachers give continuous assessment based on MLC", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("መምህራን ተከታታይ ምዘና ስርዓት ይረዳሉ","Teachers understand continuous assessment"),
    c("ተከታታይ ምዘና በMLC መሰረት","Continuous assessment based on MLC"),
    c("ክፍሎች ተከታታይ ምዘናን ይረዳሉ","Classes understand continuous assessment"),
    c("ተከታታይ ምዘና ተግባር ላይ ነው","Continuous assessment operational"))

add("18.3", 0.5, "መምህራን ተከታታይ ምዘናን በመጠቀም ግብረ-መልስ ይሰጣሉ",
    "Teachers use continuous assessment to give feedback", ("DOCUMENT_REVIEW",),
    c("መምህራን ተከታታይ ምዘና ውጤትን ይመዘግባሉ","Teachers record continuous assessment results"),
    c("መምህራን በወቅቱ ግብረ-መልስ ይሰጣሉ","Teachers give timely feedback"))

add("18.4", 1, "መምህራን ዝቅተኛ ውጤት ያላቸውን ተማሪዎች ተጨማሪ ድጋፍ ይሰጣሉ",
    "Teachers give additional support to low achievers", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ዝቅተኛ ውጤት ያላቸው ተማሪዎች ዝርዝር ተመዝግቧል","Low achievers list maintained"),
    c("ዝቅተኛ ውጤት ያላቸው ተማሪዎች ተጨማሪ ድጋፍ ተሰጥቷል","Additional support provided to low achievers"),
    c("መምህራን የውጤት ትንተና ሰርተዋል","Teachers conducted results analysis"))

add("18.5", 0.5, "መምህራን በሴሚስተር አጋማሽ ውጤትን ለወላጆች በማሳወቅ ግብረ-መልስ ይቀበላሉ",
    "Teachers share semester results with parents and receive feedback", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("መምህራን የውጤት ማሳወቂያ/ግብረ-መልስ ስርዓት ዘርገተዋል","Results reporting/feedback system established"),
    c("መምህራን ውጤትን ለወላጆች በሴሚስተር አጋማሽ አሳውቀዋል","Results shared with parents mid-semester"),
    c("መምህራን ከወላጆች ግብረ-መልስ ተቀብለዋል","Teachers received parent feedback"))

# Standard 19 merged 19.1+19.2
add("19.1", 2, "መምህራን የስርዓተ-ትምህርት/ሰነዶችን በግልና በቡድን ገምግመው ግብረ-መልስ ይሰጣሉ እና ከት/ጽ/ቤት ግምገማ አስተያየት ይቀበላሉ",
    "Teachers review curriculum materials collaboratively and receive textbook office evaluation feedback", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("መምህራን የስርዓተ-ትምህርት ሰነዶችን ለመገምገም ስርዓት ዘርገተዋል","System to review curriculum documents established"),
    c("መምህራን መርሃ-ትምህርቶችን በግል ገምግመዋል","Teachers individually reviewed lesson materials"),
    c("መምህራን መርሃ-ትምህርቶችን በጋራ ገምግመዋል","Teachers collaboratively reviewed lesson materials"),
    c("መምህራን የስርዓተ-ትምህርት ግምገማ ግብረ-መልስ በደረጃ ይቀበላሉ","Teachers receive staged curriculum review feedback"),
    c("ትምህርት ቤቱ የስርዓተ-ትምህርት ግምገማ ሪፖርት ከት/ጽ/ቤት አስተያየት ይቀበላል","School receives textbook office comments on curriculum review report"),
    c("ትምህርት ቤቱ ከተመለከተው አካሊት የስርዓተ-ትምህርት ግምገማ አስተያየት ይቀበላል","School receives curriculum review feedback from relevant body"))

add("19.3", 1, "መምህራን በጋራ Lesson study/planning ተግባራትን አከናውኗል",
    "Teachers conducted collaborative lesson study/planning", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("በየትምህርት ክፍል የጋራ ግንዛቤ ተፈጥሯል","Shared understanding per subject created"),
    c("በጋራ ግንዛቤ መሰረት ተግባራዊ ተደርጓል","Implemented based on shared understanding"))

# Standard 20
add("20.1", 1.5, "አዲስ ጀማሪ መምህራን Induction ተግባራዊ አድርገዋል ነባር መምህራን CPD ተግብረዋል",
    "New teachers completed induction; existing teachers completed CPD", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("አዲስ ጀማሪ መምህራን Induction Course አጠናቀቁ","New teachers completed induction course"),
    c("ነባር መምህራን 60-ሰዓት CPD አጠናቀቁ","Existing teachers completed 60-hour CPD"))

add("20.2", 1.5, "የት/ቤት አመራሮች CPD ተግባራዊ አድርገዋል",
    "School leaders implemented CPD", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ር/መምህራን 60-ሰዓት CPD አጠናቀቁ","Principal completed 60-hour CPD"),
    c("ሱፐርቫይዘር CPD ለትምህርት ቤቱ ድጋፍ አድርጓል","Supervisor CPD supports the school"))

# Standard 21
add("21.1", 2, "ትምህርት ቤቱ ከተማሪ ወላጆች ጋር ቋሚ የግንኙነት ጊዜ ፈጥሮ ተግባራዊ አድርጓል",
    "School established and implements regular parent communication", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ትምህርት ቤቱ ከወላጆች ጋር የሚገናኝበት ስርዓት ዘርጎቷል","Parent communication system established"),
    c("ወላጆች የተዘረጋውን ስርዓት ይረዳሉ","Parents understand the system"),
    c("የተዘረጋው ስርዓት ተግባራዊ ሆኗል","System implemented"))

add("21.2", 2, "ወላጆች በኮሚቴዎች፣ አደረጃጀቶች እና መድረኮች በንቃት ይሳተፋሉ",
    "Parents actively participate in committees and forums", ("INTERVIEW","DOCUMENT_REVIEW"),
    c("ትምህርት ቤቱ ወላጆችን በኮሚቴዎች/Aደረጃጀቶች ይሳተፋል","Parents participate in committees/structures"),
    c("ወላጆች ስርዓቱን ይረዳሉ","Parents understand participation system"),
    c("ወላጆች ተግባራዊ ተሳትፈዋል","Parents actively participate"))

# Standard 22
add("22.1", 3, "ወላጆች በገንዘብ፣ በአይነት፣ በእውቀትና በጉልበት ለትምህርት ቤቱ ድጋፍ አድርገዋል",
    "Parents contribute cash, in-kind, knowledge and labour", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ከእቅድ አንፃር የጉልበት ድጋፍ","Labour support per plan"),
    c("ከእቅድ አንፃር የገንዘብ ድጋፍ","Cash support per plan"),
    c("ከእቅድ አንፃር የአይነት ድጋፍ","In-kind support per plan"),
    c("ከእቅድ አንፃር በእውቀት ድጋፍ","Knowledge support per plan"))

add("22.2", 3, "ከማህበረሰብ፣ ቀደም ተማሪዎች እና ተቋማት ለትምህርት ቤቱ ድጋፍ ተሰጥቷል",
    "Community, alumni and institutions contributed to the school", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ከእቅድ አንፃር የጉልበት ድጋፍ","Labour support per plan"),
    c("ከእቅድ አንፃር የገንዘብ ድጋፍ","Cash support per plan"),
    c("ከእቅድ አንፃር የአይነት ድጋፍ","In-kind support per plan"),
    c("ከእቅድ አንፃር በእውቀት ድጋፍ","Knowledge support per plan"))

# Standard 23
add("23.1", 1, "ትምህርት ቤቱ ለማህበረሰብ አገልግሎት የሚያስችል ስርዓት ዘርጎ ተግባራዊ አድርጓል",
    "School established community service system", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የማህበረሰብ አገልግሎት ሥርዓት ተዘርግቷል","Community service system established"),
    c("የተዘረጋው አሰራር ተሰማይቷል","Operational approach communicated"),
    c("የተዘረጋው አሰራር ተግባራዊ ሆኗል","Approach implemented"))

add("23.2", 1, "ትምህርት ቤቱ ለማህበረሰብ የመማማሪያ/መመከሪያ/ልምድ-መแลก ማዕከል ሆኗል",
    "School serves as community learning/counselling/experience centre", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ማህበረሰብ ሀብቶችን እንዲጠቀም የተዘጋ ስርዓት ተግባራዊ ሆኗል","System for community use of resources operational"),
    c("ማህበረሰብ ሀብቶችን እንዲጠቀም ተደርጓል","Community enabled to use school resources"))

# Standard 24
add("24.1", 0.5, "ወላጆች ለልጆቻቸው ውጤት መሻሻያ ድጋፍ አድርገዋል",
    "Parents support children's learning improvement", ("INTERVIEW","DOCUMENT_REVIEW"),
    c("ለተማሪዎች የሚያስፈልጉ ግብዓቶች ተሟልተዋል","Required inputs for students provided"),
    c("የቤት/ክፍል ስራና ፕሮጀክቶች ተከታተለ","Home/class work and projects monitored"))

add("24.2", 1, "ወላጆች ልጆቻቸው በትምህርት ገበታ ላይ እንዲገኙ ተከታተለ",
    "Parents monitor children's attendance at learning", ("INTERVIEW",),
    c("ወላጆች ልጆቻቸው በትምህርት ገበታ ይገኛሉ","Parents ensure children attend learning sessions"))

add("24.3", 0.5, "ወላጆች ለልጆቻቸው ባህሪ መሻሻያ የድርሻቸውን ይወጣሉ",
    "Parents fulfill role in behaviour improvement", ("INTERVIEW",),
    c("ወላጆች የባህሪ ድጋፍ ጥያቄዎችን አፈጽመዋል","Parents respond to behaviour support requests"),
    c("ወ.ተ.መ.ህ ለወላጆች ግንዛብ ፈጥሯል","PTA created parent awareness on behaviour"))

add("24.4", 1, "የተማሪ ወላጅ-መምህር ግንኙነት ጠንካራ ሆኗል",
    "Parent-teacher relationship strengthened", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("ወ.ተ.መ.ህ አመታዊ እቅድ አዘጅቷል","PTA prepared annual plan"),
    c("ወ.ተ.መ.ህ በእቅድ መሰረት ግንኙነት አካሂዷል","PTA conducted planned engagement"),
    c("ወ.ተ.መ.ህ እቅድን ተግባራዊ አድርጓል","PTA implemented plan"),
    c("የግንኙነት መዝገቦች አሉ","Engagement records exist"))

# Standard 25
add("25.1", 0.5, "ትምህርት ቤቱ መጠነ-ማቋረጥ በዕቅድ ቀንሷል",
    "School reduced dropout rate per plan", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የታቀደው መጠነ-ማቋረጥ ግብ ተሳክቷል","Planned dropout reduction target achieved"))

add("25.2", 1.5, "ትምህርት ቤቱ መጠነ-መደገም በዕቅድ ቀንሷል",
    "School reduced repetition rate per plan", ("DOCUMENT_REVIEW","INTERVIEW"),
    c("የታቀደው መጠነ-መደገም ግብ ተሳክቷል","Planned repetition reduction target achieved"))

add("25.3", 1, "ትምህርት ቤቱ መጠነ-ማርፍድ በዕቅድ ቀንሷል",
    "School reduced wastage rate per plan", ("DOCUMENT_REVIEW",),
    c("የታቀደው መጠነ-ማርፍድ ግብ ተሳክቷል","Planned wastage reduction target achieved"))

add("25.4", 1.5, "የትምህርት ቤቱ የማሳለፍ ምጣኔ ጨምሯል/ተሻሽሏል",
    "School promotion rate increased/improved", ("DOCUMENT_REVIEW",),
    c("ከክፍል-ክፍል ዝውውር በእቅድ ተሻሽሏል","Grade-to-grade promotion improved per plan"),
    c("በክሊኒክ ፈተና የማሳለፍ ምጣኔ ተሻሽሏል","Clinical exam promotion rate improved"),
    c("በብሄራዊ ፈተና የማሳለፍ ምጣኔ ተሻሽሏል","National exam promotion rate improved"))

# Standard 26
add("26.1", 1.5, "ሁሉም ተማሪዎች በክፍል ፈተና በእያንዳንዱ የትምህርት ዓይነት 50% እና በላይ",
    "All students score 50%+ in each subject on class exams", ("DOCUMENT_REVIEW",),
    c("ሁሉም ተማሪዎች በእያንዳንዱ የትምህርት ዓይነት 50%+ ውጤት","All students score 50%+ per subject"))

add("26.2", 1.5, "ሁሉም ተማሪዎች በ6ኛ ክፍል ክሊኒክ ፈተና 50%+",
    "All students score 50%+ on grade 6 clinical exam", ("DOCUMENT_REVIEW",),
    c("ሁሉም ተማሪዎች በ6ኛ ክፍል ክሊኒክ 50%+","All students score 50%+ on grade 6 clinical exam"))

add("26.3", 1.5, "ሁሉም ተማሪዎች በ8ኛ ክፍል ፈተና 50%+",
    "All students score 50%+ on grade 8 exam", ("DOCUMENT_REVIEW",),
    c("ሁሉም ተማሪዎች በ8ኛ ክፍል 50%+","All students score 50%+ on grade 8 exam"))

add("26.4", 1, "በትምህርት ቤቱ ተከታታይ የተሻሻለ የተማሪ ውጤት ምዝገባ ልምድ ተዲብሯል",
    "Culture of recording improving student results established", ("DOCUMENT_REVIEW",),
    c("ባለፈት 3 አመት ክሊኒክ ፈተና ውጤት ተሻሽሏል","Clinical exam results improved over 3 years"),
    c("ባለፈት 3 አመት ሀገራዊ ፈተና ውጤት ተሻሽሏል","National exam results improved over 3 years"))

add("26.5", 1, "ለሴት ተማሪዎች በልዩ ድጋፍ 50%+ ውጤት",
    "Female students score 50%+ with special support", ("DOCUMENT_REVIEW",),
    c("ሴት ተማሪዎች በልዩ ድጋፍ 50%+ ውጤት","Female students score 50%+ with special support"))

add("26.6", 1, "ልዩ የትምህርት ፍላጎት ተማሪዎች በልዩ ድጋፍ 50%+",
    "Special needs students score 50%+ with special support", ("DOCUMENT_REVIEW",),
    c("ልዩ ፍላጎት ተማሪዎች በልዩ ድጋፍ 50%+","Special needs students score 50%+ with special support"))

add("26.7", 1, "ሁሉም ተማሪዎች በተግባር ፈተና በሰለጠኑበት መስክ ብቁ ናቸው",
    "All students competent in practical exam for trained field", ("DOCUMENT_REVIEW",),
    c("ሁሉም ተማሪዎች በተግባር ፈተና ብቁ","All students competent on practical exam"))

# Standard 27
add("27.1", 1, "ተማሪዎች የሚፈጸም ኩረጃ ፀያፍ መሆኑን ተገንዝበው በተግባር ያሳያሉ",
    "Students reject cheating culture and demonstrate integrity", ("OBSERVATION","INTERVIEW"),
    c("የጸረ-ኩረጃ ስርዓት ተባይነት አግኝቷል","Anti-cheating system accepted"),
    c("የኮራጅ ተማሪዎች ቁጥር ቀንሷል","Courageous/integrity student numbers increased"))

add("27.2", 1, "በተማሪዎች መካከል በጎ ፍቃደ-መረዳዳት ባህል ተዲብሯል",
    "Culture of peer support established", ("OBSERVATION","INTERVIEW"),
    c("የመተላለፊያ ቁሳቁሶች ማሰባሰብና ተዛማጅ ስርዓት","Peer material sharing system established"),
    c("ተማሪዎች እርስ በርስ በትምህርት ይረዳሉ","Students support each other in learning"))

add("27.3", 1, "የተማሪዎች የመከባበር ባህል ተዲብሯል",
    "Student respect culture developed", ("OBSERVATION","INTERVIEW"),
    c("ተማሪዎች እርስ በርስ የመከባበር ባህል","Students respect each other"),
    c("ተማሪዎች መምህራንንና አመራሩን ያክብራሉ","Students respect teachers and leaders"),
    c("ተማሪዎች ግዳታቸውን ተወጥተው ይታገላሉ","Students fulfill duties patiently"),
    c("ተማሪዎች የመተማመን ልምድ ጎልብቷል","Trust culture improved"),
    c("ተማሪዎች ት/ቤት ማህበረሰብን ያክብራሉ","Students respect school community"))

add("27.4", 1, "ተማሪዎች ሃሳባቸውን በራስ-መተማመን ይግለጻሉ",
    "Students express ideas with self-confidence", ("OBSERVATION","INTERVIEW"),
    c("ተማሪዎች በStudent council/parliament ሃሳባቸውን ያቀርባሉ","Students express ideas through student council"),
    c("ተማሪዎች በራስ-መተማመን ልምድ ጎልብተዋል","Students developed self-confidence"))

# Standard 28
add("28.1", 1, "በትምህርት ቤቱ የተዘጋጀው መተዳደሪያ መንግስት አጋዥነት ሰላማዊ አካባቢ ፈጥሯል",
    "Prepared regulatory framework supports peaceful school environment", ("OBSERVATION","INTERVIEW"),
    c("ተማሪዎች የትምህርት ቤቱን መተዳደሪያ መንግስት ያክብራሉ","Students respect school regulations"),
    c("መምህራን የትምህርት ቤቱን መተዳደሪያ መንግስት ያክብራሉ","Teachers respect school regulations"),
    c("ድጋፍ ሰጪ ሰራተኞች መተዳደሪያ መንግስት ያክብራሉ","Support staff respect regulations"))

add("28.2", 1, "በትምህርት ማህበረሰብ የመረዳዳት/መከባበር ባህል ተዲብሯል",
    "Mutual support/respect culture in school community developed", ("OBSERVATION","DOCUMENT_REVIEW"),
    c("መረዳዳትን ለማስፈን ስልቶች ተተግብረዋል","Strategies to promote mutual support implemented"),
    c("በማህበረሰብ መካከል የመከባበር ባህል ተዲብሯል","Respect culture among community developed"))

add("28.3", 1, "ተማሪዎች ትምህርት ቤታቸውንና አካባቢያቸውን ይንከባከባሉ",
    "Students care for school and environment", ("OBSERVATION",),
    c("ተማሪዎች ትምህርት ቤታቸውን ይንከባከባሉ","Students care for their school"),
    c("ተማሪዎች የትምህርት ቤታቸውን አካባቢ ይንከባከባሉ","Students care for school environment"),
    c("ተማሪዎች አካባቢን መጠበቅ ይሰራሉ","Students work to protect environment"))

RAW.extend(RAW_REST)


def build_specs() -> list[dict]:
    specs: list[dict] = []
    for code, mp, tam, ten, sources, *crits in RAW:
        specs.append(ind(code, mp, tam, ten, sources, *crits))
    return specs


def py_str(s: str) -> str:
    return repr(s)


def render_criterion(am: str, en: str) -> str:
    return f"        crit({py_str(am)}, {py_str(en)}),"


def render_indicator(spec: dict) -> str:
    src = ", ".join(f'"{s}"' for s in spec["dataSources"])
    lines = [
        "    ind(",
        f'        "{spec["code"]}", {spec["maxPoints"]!r},',
        f"        {py_str(spec['titleAm'])},",
        f"        {py_str(spec['titleEn'])},",
        f"        ({src}),",
    ]
    for crit in spec["criteria"]:
        lines.append(render_criterion(crit["titleAm"], crit["titleEn"]))
    lines.append("    ),")
    return "\n".join(lines)


def render_module(specs: list[dict]) -> str:
    body = "\n".join(render_indicator(s) for s in specs)
    return f'''"""MOE Ethiopia Internal Inspection Checklist 2017 Primary/Middle NG schools."""


def crit(am, en):
    return {{"titleAm": am, "titleEn": en}}


def ind(code, mp, tam, ten, sources, *criteria):
    std = int(code.split(".")[0])
    return {{
        "code": code,
        "standardNumber": std,
        "maxPoints": mp,
        "titleAm": tam,
        "titleEn": ten,
        "dataSources": list(sources),
        "criteria": [crit(am, en) for am, en in criteria],
    }}


ALL_INDICATOR_SPECS = [
{body}
]

assert len(ALL_INDICATOR_SPECS) == 100
assert sum(len(s["criteria"]) for s in ALL_INDICATOR_SPECS) == 304
'''


def main() -> None:
    specs = build_specs()
    n_ind = len(specs)
    n_crit = sum(len(s["criteria"]) for s in specs)
    if n_ind != 100:
        raise SystemExit(f"Expected 100 indicators, got {n_ind}")
    if n_crit != 304:
        raise SystemExit(f"Expected 304 criteria, got {n_crit}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render_module(specs) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({n_ind} indicators, {n_crit} criteria)")


if __name__ == "__main__":
    main()
