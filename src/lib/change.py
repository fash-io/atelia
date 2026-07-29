import re


res = {}
props = ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius']

with open("txt.txt", "r", encoding="utf-8")as file:
    for line in file:
        line = line.replace("\"", "")
        line = line.replace(",", "")
        name, val = line.split(":")
        
        res[name] = {}
        val = val.strip()
        percentages = re.findall(r"\d+%", val)
        
        for i in range(8):
            p = props[i % 4]
            if p in res[name]:
                res[name][f"{p}"] = res[name][f"{p}"] +" "+ percentages[i]
                continue
            res[name][f"{p}"] = percentages[i]

with open('out.txt', "w", encoding='utf-8')as out:
    for key, val in res.items():
        out.write(f".blog.{key.lower().replace(" ", "_")} {{")
        for key2, val2 in val.items():
            out.write(f"\n{key2}: {val2};")
        out.write("\n }\n")
