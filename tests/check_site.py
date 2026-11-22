from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
root=Path(__file__).resolve().parents[1]
class Checker(HTMLParser):
 def __init__(self,name):super().__init__();self.name=name;self.ids=set();self.headings=[];self.errors=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1':self.headings.append(tag)
  if 'id' in a:
   if a['id'] in self.ids:self.errors.append('duplicate id '+a['id'])
   self.ids.add(a['id'])
  for key in ('src','href','srcset'):
   if key not in a or a[key] is None:continue
   candidates=[a[key]] if key!='srcset' else [chunk.strip().split(' ')[0] for chunk in a[key].split(',')]
   for url in candidates:
    u=urlsplit(url).path
    if not u or u.startswith('/') or ':' in url or url.startswith('//'):continue
    if not (root/unquote(u)).is_file():self.errors.append('missing '+url)
files=sorted(root.glob('*.html'));assert len(files)==11,len(files)
for f in files:
 c=Checker(f.name);c.feed(f.read_text(encoding='utf8'))
 if len(c.headings)!=1:c.errors.append('must have one h1')
 if c.errors:raise AssertionError(f.name+': '+str(c.errors))
 print('PASS',f.name)
print('PASS all',len(files),'HTML pages')
