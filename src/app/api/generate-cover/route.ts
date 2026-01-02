// @ts-ignore
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const PY_GENERATE_COVER_URL = process.env.PY_GENERATE_COVER_URL || 'http://127.0.0.1:8000/generate-cover';

interface CoverInfo {
  studentName: string;
  applicationMajor: string;
  undergraduateSchool: string;
  graduationMajor: string;
  contactInfo: string;
  email: string;
}

export async function POST(request: Request) {
  try {
    const coverInfo: CoverInfo = await request.json();

    // 验证必填字段
    if (!coverInfo.studentName || !coverInfo.applicationMajor ||
        !coverInfo.undergraduateSchool || !coverInfo.graduationMajor) {
      return NextResponse.json(
        { error: '缺少必填字段：学生姓名、申请专业、本科院校、毕业专业' },
        { status: 400 }
      );
    }

    // 调用Python后端生成封面
    const response = await fetch(PY_GENERATE_COVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          "学生姓名": coverInfo.studentName,
          "申请专业": coverInfo.applicationMajor,
          "本科院校": coverInfo.undergraduateSchool,
          "毕业专业": coverInfo.graduationMajor,
          "联系方式": coverInfo.contactInfo || "",
          "邮箱": coverInfo.email || ""
        },
        school: coverInfo.undergraduateSchool
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python cover generation failed:', errorText);
      return NextResponse.json(
        { error: `封面生成失败: ${response.status} ${errorText}` },
        { status: 500 }
      );
    }

    // 返回生成的PDF
    const pdfBuffer = await response.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="cover.pdf"'
      }
    });

  } catch (error: any) {
    console.error('Cover generation error:', error);
    return NextResponse.json(
      { error: `封面生成失败: ${error.message}` },
      { status: 500 }
    );
  }
}


