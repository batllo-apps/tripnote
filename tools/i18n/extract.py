import re,json,sys
src=open('/home/claude/tripnote/app.js').read()
H=re.compile(r'[가-힣]')
out=[]  # (kind, text) ; text with {0}.. placeholders for ${}
def parse_template(s,i):
    # s[i] is after backtick; returns (pieces, end_index) ; pieces: list of str or ('expr', inner_strings)
    buf='';parts=[];n=0
    while i<len(s):
        c=s[i]
        if c=='\\':buf+=s[i:i+2];i+=2;continue
        if c=='`':parts.append(buf);return parts,i+1
        if c=='$' and s[i+1]=='{':
            parts.append(buf);buf='';j,end=parse_expr(s,i+2);parts.append(('E',))
            i=end;continue
        buf+=c;i+=1
    return parts,i
def parse_expr(s,i):
    depth=1
    while i<len(s):
        c=s[i]
        if c in '"\'':i=parse_str(s,i);continue
        if c=='`':
            parts,i=parse_template(s,i+1);emit_template(parts);continue
        if c=='/' and s[i+1] not in '/*':
            k=i-1
            while k>=0 and s[k] in ' \t\n':k-=1
            if s[k] in '(,=:[!&|?{};':
                j=i+1;cls=False
                while j<len(s):
                    ch=s[j]
                    if ch=='\\':j+=2;continue
                    if ch=='[':cls=True
                    elif ch==']':cls=False
                    elif ch=='/' and not cls:break
                    j+=1
                i=j+1;continue
        if c=='{':depth+=1
        elif c=='}':
            depth-=1
            if depth==0:return None,i+1
        i+=1
    return None,i
def parse_str(s,i):
    q=s[i];j=i+1;buf=''
    while j<len(s):
        c=s[j]
        if c=='\\':buf+=s[j:j+2];j+=2;continue
        if c==q:break
        buf+=c;j+=1
    if H.search(buf):emit_text(buf)
    return j+1
def emit_text(t):
    for chunk in re.split(r'<[^>]*>',t):
        if H.search(chunk):out.append(chunk.strip())
def emit_template(parts):
    # join pieces; ${} -> {n}; split on tags
    s='';k=0
    for p in parts:
        if isinstance(p,tuple):s+='{%d}'%k;k+=1
        else:s+=p
    for chunk in re.split(r'<[^>]*>',s):
        if H.search(chunk):
            # renumber placeholders inside chunk from 0
            idx=[0]
            def rn(m):r='{%d}'%idx[0];idx[0]+=1;return r
            out.append(re.sub(r'\{\d+\}',rn,chunk).strip())
i=0
while i<len(src):
    c=src[i]
    if src.startswith('//',i):i=src.find('\n',i);continue
    if src.startswith('/*',i):i=src.find('*/',i)+2;continue
    if c in '"\'':i=parse_str(src,i);continue
    if c=='`':parts,i=parse_template(src,i+1);emit_template(parts);continue
    if c=='/' and not src.startswith('//',i) and not src.startswith('/*',i):
        k=i-1
        while k>=0 and src[k] in ' \t\n':k-=1
        if k<0 or src[k] in '(,=:[!&|?{};+-*%<>~^' or src[max(0,k-5):k+1].endswith('return'):
            j=i+1;cls=False
            while j<len(src):
                ch=src[j]
                if ch=='\\':j+=2;continue
                if ch=='[':cls=True
                elif ch==']':cls=False
                elif ch=='/' and not cls:break
                elif ch=='\n':break
                j+=1
            i=j+1;continue
    i+=1
seen=[];
for t in out:
    t=re.sub(r'\s+',' ',t)
    if t and t not in seen:seen.append(t)
json.dump(seen,open('segs.json','w'),ensure_ascii=False,indent=0)
print(len(seen),sum(len(x) for x in seen))
