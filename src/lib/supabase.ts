// Supabase client for baoyan-agent

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gqbuuizdoscpxdychnnv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxYnV1aXpkb3NjcHhkeWNobm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MjY2NzIsImV4cCI6MjA4MjQwMjY3Mn0.D8r4HZwJ6iWjU1bOeo9z-2SGbg72BpWZIuxEXBtpwi4';

const getToken = () => localStorage.getItem('sb-token');

const baseHeaders = () => ({
  'apikey': supabaseAnonKey,
  'Authorization': `Bearer ${getToken() || supabaseAnonKey}`,
  'Content-Type': 'application/json'
});

class QueryBuilder {
  private table: string;
  private filters: string[] = [];
  private orderStr = '';
  private selectStr = '*';
  private isSingle = false;
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private body: any = null;
  private upsertFlag = false;

  constructor(table: string) {
    this.table = table;
  }

  select(cols = '*') {
    this.selectStr = cols;
    return this;
  }

  eq(col: string, val: string | number | boolean) {
    this.filters.push(`${col}=eq.${val}`);
    return this;
  }

  neq(col: string, val: string | number | boolean) {
    this.filters.push(`${col}=neq.${val}`);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderStr = `${col}.${opts?.ascending ? 'asc' : 'desc'}`;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this.execute();
  }
 
  // alias used in consumed code
  single() {
    this.isSingle = true;
    return this.execute();
  }

  insert(data: any) {
    this.method = 'POST';
    this.body = data;
    return this;
  }

  upsert(data: any) {
    this.method = 'POST';
    this.body = data;
    this.upsertFlag = true;
    return this;
  }

  update(data: any) {
    this.method = 'PATCH';
    this.body = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  private buildUrl() {
    let url = `${supabaseUrl}/rest/v1/${this.table}`;
    const params: string[] = [];
    if (this.selectStr && this.method === 'GET') params.push(`select=${this.selectStr}`);
    params.push(...this.filters);
    if (this.orderStr) params.push(`order=${this.orderStr}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return url;
  }

  private async execute(): Promise<{ data: any; error: any }> {
    const url = this.buildUrl();
    const headers: Record<string, string> = baseHeaders();
    if (this.method !== 'GET' && this.method !== 'DELETE') {
      if (this.upsertFlag) {
        headers['Prefer'] = 'resolution=merge-duplicates,return=representation';
      } else {
        headers['Prefer'] = 'return=representation';
      }
    }

    const options: RequestInit = { method: this.method, headers };
    if (this.body) options.body = JSON.stringify(this.body);

    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        return { data: null, error };
      }
      if (this.method === 'DELETE') {
        return { data: null, error: null };
      }
      const data = await res.json();
      return { data: this.isSingle ? (data[0] || null) : data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }

  then(resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) {
    return this.execute().then(resolve, reject);
  }
}

export const supabase = {
  auth: {
    getUser: async () => {
      const token = getToken();
      if (!token) return { data: { user: null }, error: null };
      try {
        const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return { data: { user: null }, error: null };
        const user = await res.json();
        return { data: { user }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    },
    getSession: async () => {
      const token = getToken();
      return { data: { session: token ? { access_token: token } : null } };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { data: null, error: { message: data.error_description || data.error || 'Login failed' } };
      }
      if (data.access_token) localStorage.setItem('sb-token', data.access_token);
      return { data: { user: data.user }, error: null };
    },
    signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: any } }) => {
      const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, data: options?.data })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { data: null, error: { message: data.error_description || data.error || 'Signup failed' } };
      }
      if (data.access_token) localStorage.setItem('sb-token', data.access_token);
      return { data: { user: data.user || data }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem('sb-token');
      return { error: null };
    },
    onAuthStateChange: (callback?: (event: string, session: any) => void) => {
      // This is a stubbed listener for compatibility with supabase-js usage.
      // It does not provide real-time events in this lightweight client.
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  from: (table: string) => new QueryBuilder(table),
  // Minimal storage wrapper to support browser uploads and public URLs.
  storage: {
    from: (bucket: string) => {
      return {
        // Upload a file to storage using PUT (compatible with Supabase storage REST)
        upload: async (path: string, file: Blob | File, opts?: { upsert?: boolean }) => {
          const encodedPath = encodeURIComponent(path);
          const url = `${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`;
          const headers: Record<string, string> = {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${getToken() || supabaseAnonKey}`,
          };
          if (opts?.upsert) headers['x-upsert'] = 'true';

          try {
            const res = await fetch(url, {
              method: 'PUT',
              headers,
              body: file as BodyInit,
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: res.statusText }));
              return { data: null, error: err };
            }
            // Supabase storage PUT returns empty body on success; return basic info.
            return { data: { path }, error: null };
          } catch (e: any) {
            return { data: null, error: { message: e.message } };
          }
        },
        // Return a public URL for the object (public bucket or signed URL workflow)
        getPublicUrl: (path: string) => {
          const encodedPath = encodeURIComponent(path);
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
          return { data: { publicUrl }, error: null };
        },
        // Download an object as Blob
        download: async (path: string) => {
          const encodedPath = encodeURIComponent(path);
          const url = `${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`;
          const headers: Record<string, string> = {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${getToken() || supabaseAnonKey}`,
          };
          try {
            const res = await fetch(url, { method: 'GET', headers });
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: res.statusText }));
              return { data: null, error: err };
            }
            const blob = await res.blob();
            return { data: blob, error: null };
          } catch (e: any) {
            return { data: null, error: { message: e.message } };
          }
        },
        // Remove objects from a bucket. Accepts array of paths.
        remove: async (paths: string[]) => {
          const url = `${supabaseUrl}/storage/v1/object/${bucket}`;
          const headers: Record<string, string> = {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${getToken() || supabaseAnonKey}`,
            'Content-Type': 'application/json',
          };
          try {
            const res = await fetch(url, {
              method: 'DELETE',
              headers,
              body: JSON.stringify({ files: paths }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: res.statusText }));
              return { data: null, error: err };
            }
            return { data: { removed: paths }, error: null };
          } catch (e: any) {
            return { data: null, error: { message: e.message } };
          }
        },
      };
    },
  },
  functions: {
    invoke: async (name: string, options: { body: any }) => {
      const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify(options.body)
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: data };
      return { data, error: null };
    }
  }
};

export const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;

// 生成唯一文件名
export const generateFileName = (userId: string, originalName: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || 'pdf';
  return `${userId}/${timestamp}_${randomStr}.${ext}`;
};

// 检查 Supabase 是否已配置
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
