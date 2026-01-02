from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import re
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
'''''
# 进入 backend 目录（如果后端在 backend）
cd /home/root1/baoyan_agent/backend

# 2. 激活虚拟环境
source venv/bin/activate

# 3. 启动服务
uvicorn python_parse_service:app --host 127.0.0.1 --port 8000


'''''
load_dotenv()

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

app = FastAPI(title="Agent Parse Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ParseRequest(BaseModel):
    text: str

class MatchRequest(BaseModel):
    items: List[Dict[str, Any]]
    materials: List[Dict[str, Any]]

# --- 工具函数 ---
def extract_json_robust(text: str):
    text = text.strip()
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1:
        json_str = text[start : end + 1]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            clean_str = json_str.replace("```json", "").replace("```", "").strip()
            try:
                return json.loads(clean_str)
            except:
                pass
    return None

def get_client():
    key = os.getenv("OPENAI_API_KEY")
    if not key or OpenAI is None:
        return None
    try:
        return OpenAI(
            api_key=key,
            base_url=os.getenv("OPENAI_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
        )
    except TypeError as te:
        # Compatibility issue between installed openai/httpx versions
        print(f"OpenAI client initialization failed (TypeError): {te}")
        return None
    except Exception as e:
        print(f"OpenAI client initialization failed: {e}")
        return None

# --- 1. Parse (解析) 接口 (保持之前优化的版本) ---
@app.post("/parse")
def parse(req: ParseRequest):
    text = req.text or ""
    if not text.strip():
        return []

    client = get_client()
    if not client: return []

    prompt = f"""
You are an expert data cleaning assistant. Extract required materials from text.

Input Text:
\"\"\"{text}\"\"\"

Output Requirements:
1. Output ONLY a valid JSON Array.
2. Object fields: "label" and "category".
3. **Label Cleaning**: REMOVE university names, brackets like "(见附件)", "(需签字)". Keep concise core nouns (e.g., "报名表", "本科成绩单").
4. **Category**: [transcript, english, personal, recommendation, certificate, paper, identity, application_form, other].

Examples:
Input: "（1）《同济大学报名表》（需签字）" -> Output: [{{"label": "报名表", "category": "application_form"}}]
Input: "2. 本科成绩单(带印章)" -> Output: [{{"label": "本科成绩单", "category": "transcript"}}]

Output JSON array:
"""
    try:
        resp = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "qwen-falsh"),
            messages=[
                {"role": "system", "content": "You are a strict parser. Output valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
        )
        parsed = extract_json_robust(resp.choices[0].message.content)
        return JSONResponse(content=parsed if parsed else [])
    except Exception as e:
        print(f"Parse Error: {e}")
        return JSONResponse(content=[])


# --- 2. Match (匹配) 接口 (核心修正) ---
@app.post("/match")
def match(req: MatchRequest):
    items = req.items or []
    materials = req.materials or []
    
    if not items:
        return JSONResponse(content={"matches": []})

    client = get_client()
    if not client:
        return JSONResponse(content={"matches": []})

    # 1. 构建带有分类语义的精简列表
    category_semantics = {
        "transcript": "成绩单/绩点/排名证明",
        "english": "外语/四六级/托福雅思",
        "personal": "简历/个人陈述/计划书",
        "application_form": "报名表/申请表",
        "certificate": "获奖证书/证明",
        "recommendation": "推荐信",
        "identity": "身份证/学生证",
        "paper": "论文/出版物",
        "other": "其他材料"
    }

    minified_materials = []
    for m in materials:
        cat = m.get("category", "other")
        semantic_tag = category_semantics.get(cat, "其他")
        minified_materials.append({
            "id": m.get("id"),
            "filename": m.get("filename"), 
            "type_hint": semantic_tag
        })
    
    # 2. 基于分类的智能匹配 Prompt
    prompt = f"""
Task: Match "Required Items" to "Available Files" using category-first logic.

Required Items:
{json.dumps(items, ensure_ascii=False)}

Available Files:
{json.dumps(minified_materials, ensure_ascii=False)}

**Category-First Matching Logic (分类优先匹配逻辑):**

1. **Category Mapping (分类映射)**:
   - "本科成绩单/成绩单" → type_hint contains "成绩单"
   - "报名表/申请表" → type_hint contains "报名表"
   - "外语证明/CET/托福" → type_hint contains "外语"
   - "简历/个人陈述" → type_hint contains "简历"
   - "推荐信" → type_hint contains "推荐信"

2. **Two-Stage Matching (两阶段匹配)**:
   Stage 1 - Category Filter: Find files in the correct category first.
   Stage 2 - Content Match: Within the category, match filename content.

3. **Scoring Rules (评分规则)**:
   - Category Match (分类匹配): +50 points if type_hint matches requirement category
   - Filename Match (文件名匹配): +30 points for semantic synonyms
   - Partial Match (部分匹配): +10 points for keyword overlaps

4. **Examples (示例)**:
   - Requirement: "本科成绩单" → Find files with type_hint="成绩单/绩点/排名证明", then check filenames
   - Requirement: "报名表" → Find files with type_hint="报名表/申请表", then match "报名表", "申请表", etc.

5. **Filename De-noising (文件名降噪)**:
   - Ignore university names and personal names in filenames
   - Focus on content keywords: "成绩单", "证明", "CET", "报名表", etc.

Output JSON Structure:
{{
  "matches": [
    {{
      "item_label": "本科成绩单",
      "candidates": [
        {{ "id": "file_id_1", "score": 80, "reason": "Category:成绩单 + Filename contains '成绩'" }},
        {{ "id": "file_id_2", "score": 60, "reason": "Category:成绩单 + Partial filename match" }}
      ]
    }}
  ]
}}

Output JSON only. Prioritize category matches over filename-only matches.
"""

    try:
        print(f"Match API called with {len(items)} items and {len(materials)} materials")
        print(f"Sample materials: {minified_materials[:2] if minified_materials else 'None'}")

        resp = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "qwen-falsh"),
            messages=[
                {"role": "system", "content": "You are a smart assistant. Match files using category-first logic: find correct category first, then match content within category."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
        )

        print(f"LLM Response: {resp.choices[0].message.content[:500]}...")
        
        parsed = extract_json_robust(resp.choices[0].message.content)
        return JSONResponse(content=parsed if parsed else {"matches": []})
            
    except Exception as e:
        print(f"Match Error: {e}")
        return JSONResponse(content={"matches": []})

# Supabase storage helper functions
def download_from_supabase(bucket: str, path: str) -> bytes:
    """Download file from Supabase storage using HTTP requests"""
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        raise Exception("Supabase credentials not found")

    download_url = f"{supabase_url}/storage/v1/object/{bucket}/{path}"
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key
    }

    response = requests.get(download_url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"HTTP {response.status_code}: {response.text}")

    return response.content

class GenerateCoverRequest(BaseModel):
    fields: Dict[str, str]
    school: str

# --- 3. Generate Cover (封面生成) 接口 ---
@app.post("/generate-cover")
def generate_cover(req: GenerateCoverRequest):
    from generate_school_cover import main as generate_cover_main
    import sys
    import io
    from contextlib import redirect_stdout, redirect_stderr

    # Get field mapping
    fields = req.fields
    school = req.school

    # Create temporary directory for processing
    temp_dir = tempfile.mkdtemp()
    try:
        temp_path = Path(temp_dir)

        # Download template from Supabase
        template_bucket = "institution-assets"
        template_path = "pdf_generate/config/word_template.docx"

        template_content = download_from_supabase(template_bucket, template_path)
        template_local_path = temp_path / "template.docx"
        with open(template_local_path, 'wb') as f:
            f.write(template_content)

        # Download logo mapping (optional)
        logo_mapping_path = "pdf_generate/config/logo_mapping.json"
        try:
            mapping_content = download_from_supabase(template_bucket, logo_mapping_path)
            mapping_local_path = temp_path / "logo_mapping.json"
            with open(mapping_local_path, 'wb') as f:
                f.write(mapping_content)
        except Exception as e:
            print(f"Logo mapping download failed (optional): {e}")

        # Download template spec (optional)
        template_spec_path = "pdf_generate/config/template_spec.json"
        try:
            spec_content = download_from_supabase(template_bucket, template_spec_path)
            spec_local_path = temp_path / "template_spec.json"
            with open(spec_local_path, 'wb') as f:
                f.write(spec_content)
        except Exception as e:
            print(f"Template spec download failed (optional): {e}")

        # Create logos directory - for now, skip logo downloading to avoid complex listing
        logos_dir = temp_path / "logos"
        logos_dir.mkdir(exist_ok=True)
        # TODO: Implement logo downloading if needed

        # Generate output path
        output_path = temp_path / "cover.pdf"

        # Prepare arguments for the script
        sys.argv = [
            'generate_school_cover.py',
            '--template', str(template_local_path),
            '--logos', str(logos_dir),
            '--school', school,
            '--output', str(output_path),
            '--fields', json.dumps(fields)
        ]

        # Add spec path if it exists
        if (temp_path / "template_spec.json").exists():
            sys.argv.extend(['--spec', str(temp_path / "template_spec.json")])

        # Capture output
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()

        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            result = generate_cover_main(sys.argv[1:])

        stdout_output = stdout_capture.getvalue()
        stderr_output = stderr_capture.getvalue()

        print("Cover generation stdout:", stdout_output)
        if stderr_output:
            print("Cover generation stderr:", stderr_output)

        if result != 0 or not output_path.exists():
            error_msg = f"封面生成失败 (exit code: {result})\nstdout: {stdout_output}\nstderr: {stderr_output}"
            print(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        # Return the generated PDF content directly
        with open(output_path, 'rb') as f:
            pdf_content = f.read()

        # Return PDF content as response
        from fastapi.responses import Response
        return Response(
            content=pdf_content,
            media_type='application/pdf',
            headers={"Content-Disposition": "attachment; filename=cover.pdf"}
        )

    except Exception as e:
        # Clean up on error
        import shutil
        try:
            shutil.rmtree(temp_dir)
        except:
            pass
        print(f"Cover generation error: {e}")
        raise HTTPException(status_code=500, detail=f"封面生成失败: {str(e)}")
    finally:
        # Additional cleanup
        import shutil
        try:
            shutil.rmtree(temp_dir)
        except:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

