import importlib.util,json,subprocess,sys,tempfile,shutil,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('refresh',ROOT/'scripts/refresh-sources.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class RefreshTests(unittest.TestCase):
 def test_rss_dates_are_publication_and_feed_disappearance_never_deletes(self):
  raw=b'<rss><channel><item><title>Notice</title><link>https://www.town.minami.lg.jp/docs/1.html</link><pubDate>Thu, 15 Oct 2026 00:00:00 +0900</pubDate></item></channel></rss>';rows=m.parse_rss(raw);self.assertEqual(rows[0]['dateMeaning'],'article-publication-not-event-date');plan=m.rss_plan(rows,[{**rows[0],'url':'https://www.town.minami.lg.jp/docs/old.html'}]);self.assertFalse(plan['delete']);self.assertFalse(plan['eventDatesInferred']);self.assertEqual(len(plan['notInLatestFeedRetained']),1)
  for bad in [b'<rss><channel/></rss>',raw.replace(b'https://www.town.minami.lg.jp',b'https://evil.example')]:
   with self.assertRaises(ValueError):m.parse_rss(bad)
 def test_all_source_failures_retain_actual_published_files(self):
  with tempfile.TemporaryDirectory(prefix='minamigo-refresh-failure-')as temp:
   work=Path(temp)/'repo';shutil.copytree(ROOT,work,ignore=shutil.ignore_patterns('.git','dist','live-evidence','node_modules','__pycache__'));fixture=Path(temp)/'fixtures';fixture.mkdir();(fixture/'town.html').write_text('<html>upstream error</html>');(fixture/'rss.xml').write_text('<rss><channel/></rss>');(fixture/'calendar.ics').write_text('unavailable')
   before={f:(work/f).read_bytes()for f in m.PUBLIC};r=subprocess.run([sys.executable,'scripts/refresh-sources.py','--fixture-dir',str(fixture)],cwd=work,capture_output=True,timeout=35);self.assertEqual(r.returncode,1);summary=json.loads((work/'staging/refresh-summary.json').read_text(encoding='utf8'));self.assertTrue(summary['publicHashesUnchanged']);self.assertTrue(all(v['status']=='blocked'for v in summary['sources'].values()));self.assertEqual(before,{f:(work/f).read_bytes()for f in m.PUBLIC})
if __name__=='__main__':unittest.main()
