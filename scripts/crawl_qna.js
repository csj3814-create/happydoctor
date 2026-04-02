#!/usr/bin/env node
/**
 * happydoctors.net Q&A 크롤러
 * - 관리자 로그인 후 /bbs/index.php 로 접근
 * - 전체 32페이지에서 jb_idx 수집
 * - 각 게시글의 질문(Q)과 답변(A) 추출
 */

const http = require('http');
const querystring = require('querystring');
const fs = require('fs');

const BASE_URL = 'happydoctors.net';
const DELAY_MS = 300; // 서버 부하 방지

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpGet(path, cookies) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': cookies || '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function httpPost(path, postData, cookies) {
  return new Promise((resolve, reject) => {
    const body = typeof postData === 'string' ? postData : querystring.stringify(postData);
    const options = {
      hostname: BASE_URL,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Cookie': cookies || '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': 'http://happydoctors.net/admin/login/'
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

function extractText(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#039;/g, "'").trim() : '';
}

function extractAllCookies(setCookieHeaders) {
  if (!setCookieHeaders) return '';
  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  return cookies.map(c => c.split(';')[0]).join('; ');
}

async function login() {
  // Step 1: GET login page to get initial PHPSESSID
  const getResp = await httpGet('/admin/login/');
  const setCookies1 = getResp.headers['set-cookie'];
  const cookies1 = extractAllCookies(setCookies1);
  const sessMatch = cookies1.match(/PHPSESSID=([^;]+)/);
  const sessId = sessMatch ? sessMatch[1] : '';

  console.log('Initial session:', sessId);

  // Step 2: POST to login processor
  const loginResp = await httpPost(
    '/admin/login/action/login.proc.php',
    {
      mode: 'login',
      loginAdminId: 'adm_medi',
      loginAdminpw: 'medi0515!!',
      bakurl: ''
    },
    'PHPSESSID=' + sessId
  );

  const setCookies2 = loginResp.headers['set-cookie'];
  const cookies2 = extractAllCookies(setCookies2);
  // Combine with original session
  const finalCookie = 'PHPSESSID=' + sessId + (cookies2 ? '; ' + cookies2 : '');

  if (loginResp.body.includes('location.replace')) {
    console.log('Login successful! Redirecting to:', loginResp.body.match(/location\.replace\('([^']+)'\)/)?.[1]);
    return finalCookie;
  } else {
    console.error('Login failed:', loginResp.body.substring(0, 200));
    return null;
  }
}

async function getIdxFromPage(page, cookies) {
  const path = `/bbs/index.php?jb_code=20&page=${page}`;
  const resp = await httpGet(path, cookies);

  const idxList = [];
  const titleMap = {};

  // Extract jb_idx values and titles
  const linkPattern = /jb_mode=tdetail&jb_idx=(\d+)/g;
  let match;
  while ((match = linkPattern.exec(resp.body)) !== null) {
    const idx = parseInt(match[1]);
    if (!idxList.includes(idx)) {
      idxList.push(idx);
    }
  }

  // Extract titles from list
  const titlePattern = /<span id="translation\d+">\s*([^<]+?)(?:<span[^>]*>.*?<\/span>)?\s*<\/span>/g;
  const rows = resp.body.match(/jb_mode=tdetail&jb_idx=(\d+)[^>]*>[\s\S]*?<\/a>/g) || [];

  return idxList;
}

async function getPostDetail(jbIdx, cookies) {
  const path = `/bbs/index.php?jb_code=20&jb_mode=tdetail&jb_idx=${jbIdx}`;

  try {
    const resp = await httpGet(path, cookies);
    const html = resp.body;

    // Extract title (from th in translation1)
    const titleMatch = html.match(/id="translation1"[^>]*>[\s\S]*?<th[^>]*>([\s\S]*?)<\/th>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Extract question content (from translation4 viewCont)
    const qMatch = html.match(/id="translation4"[^>]*>\s*([\s\S]*?)\s*<\/div>/);
    const question = qMatch ? qMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#039;/g, "'").trim() : '';

    // Extract name
    const nameMatch = html.match(/id="translation2"[\s\S]*?<td>([^<]+)<\/td>/);
    const name = nameMatch ? nameMatch[1].trim() : '';

    // Extract date
    const dateMatch = html.match(/id="translation3"[\s\S]*?<td>([^<]+)<\/td>/);
    const date = dateMatch ? dateMatch[1].trim() : '';

    // Extract answer (from viewComment > review > comment)
    const answers = [];
    const commentPattern = /<div class="comment">\s*([\s\S]*?)\s*<\/div>/g;
    let cMatch;
    while ((cMatch = commentPattern.exec(html)) !== null) {
      const commentText = cMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#039;/g, "'").trim();
      if (commentText) {
        answers.push(commentText);
      }
    }

    // Extract answer dates
    const answerDates = [];
    const datePatterns = html.match(/<div class="date">([^<]+)<\/div>/g) || [];
    datePatterns.forEach(d => {
      const m = d.match(/<div class="date">([^<]+)<\/div>/);
      if (m) answerDates.push(m[1].trim());
    });

    return {
      jb_idx: jbIdx,
      title: title,
      name: name,
      date: date,
      Q: question,
      A: answers.join('\n\n'),
      answer_dates: answerDates,
      has_answer: answers.length > 0
    };
  } catch (err) {
    console.error(`Error fetching idx ${jbIdx}:`, err.message);
    return { jb_idx: jbIdx, error: err.message };
  }
}

async function main() {
  console.log('=== happydoctors.net Q&A 크롤러 시작 ===\n');

  // Login
  const cookies = await login();
  if (!cookies) {
    console.error('로그인 실패. 종료합니다.');
    process.exit(1);
  }
  console.log('로그인 성공\n');

  // Step 1: Collect all jb_idx from all pages
  console.log('페이지 목록 수집 중...');
  const allIdx = [];
  const TOTAL_PAGES = 32;

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    process.stdout.write(`  페이지 ${page}/${TOTAL_PAGES}...`);
    const idxList = await getIdxFromPage(page, cookies);
    allIdx.push(...idxList);
    process.stdout.write(` ${idxList.length}개 발견\n`);
    await sleep(DELAY_MS);
  }

  // Remove duplicates and sort
  const uniqueIdx = [...new Set(allIdx)].sort((a, b) => a - b);
  console.log(`\n총 ${uniqueIdx.length}개 게시글 idx 수집 완료\n`);

  // Save idx list for reference
  fs.writeFileSync('D:/antigravity/happydoctor/scripts/idx_list.json', JSON.stringify(uniqueIdx, null, 2));

  // Step 2: Fetch each post
  console.log('게시글 내용 수집 중...');
  const results = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < uniqueIdx.length; i++) {
    const idx = uniqueIdx[i];
    process.stdout.write(`  [${i+1}/${uniqueIdx.length}] idx=${idx}...`);

    const post = await getPostDetail(idx, cookies);
    results.push(post);

    if (post.error) {
      process.stdout.write(` 오류: ${post.error}\n`);
    } else {
      process.stdout.write(` "${post.title ? post.title.substring(0, 30) : '(제목없음)'}..." ${post.has_answer ? '[답변있음]' : '[미답변]'}\n`);
    }

    // Save progress every 20 items
    if ((i + 1) % 20 === 0 || i === uniqueIdx.length - 1) {
      fs.writeFileSync('D:/antigravity/happydoctor/scripts/qna_data.json', JSON.stringify(results, null, 2));
      console.log(`  -> ${results.length}개 저장됨`);
    }

    await sleep(DELAY_MS);
  }

  // Final summary
  const answered = results.filter(r => r.has_answer).length;
  const unanswered = results.filter(r => !r.has_answer && !r.error).length;
  const errors = results.filter(r => r.error).length;

  console.log('\n=== 크롤링 완료 ===');
  console.log(`총 수집: ${results.length}건`);
  console.log(`답변 있음: ${answered}건`);
  console.log(`미답변: ${unanswered}건`);
  console.log(`오류: ${errors}건`);
  console.log(`저장 위치: D:/antigravity/happydoctor/scripts/qna_data.json`);
}

main().catch(console.error);
