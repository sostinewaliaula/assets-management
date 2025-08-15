import { supabase, Department, Asset, User, Issue, IssueComment, AssetMaintenance } from '../lib/supabase'

// Department operations
export const departmentService = {
  async getAll(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(department: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert([department])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Department>): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Asset operations
export const assetService = {
  async getAll(): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Asset | null> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByDepartment(departmentId: string): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .insert([asset])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// User operations
export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByDepartment(departmentId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Issue operations
export const issueService = {
  async getAll(): Promise<Issue[]> {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Issue | null> {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByAsset(assetId: string): Promise<Issue[]> {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(issue: Omit<Issue, 'id' | 'created_at' | 'updated_at'>): Promise<Issue> {
    const { data, error } = await supabase
      .from('issues')
      .insert([issue])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Issue>): Promise<Issue> {
    const { data, error } = await supabase
      .from('issues')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Comment operations
export const commentService = {
  async getByIssue(issueId: string): Promise<IssueComment[]> {
    const { data, error } = await supabase
      .from('issue_comments')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async create(comment: Omit<IssueComment, 'id' | 'created_at' | 'updated_at'>): Promise<IssueComment> {
    console.log('Attempting to create comment with data:', comment);
    
    // Get the user name from the users table
    let userName = 'Unknown User';
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', comment.user_id)
        .single();
      
      if (userData?.name) {
        userName = userData.name;
      }
    } catch (error) {
      console.warn('Could not fetch user name, using default:', error);
    }
    
    const commentData = {
      ...comment,
      user_name: userName
    };
    
    console.log('Creating comment with full data:', commentData);
    
    const { data, error } = await supabase
      .from('issue_comments')
      .insert([commentData])
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error creating comment:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('Comment created successfully:', data);
    return data
  },

  async update(id: string, updates: Partial<IssueComment>): Promise<IssueComment> {
    const { data, error } = await supabase
      .from('issue_comments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('issue_comments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Test function to check table structure
  async testTableStructure(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('issue_comments')
        .select('*')
        .limit(1)
      
      if (error) {
        console.error('Error testing table structure:', error);
      } else {
        console.log('Table structure test successful. Sample data:', data);
      }
    } catch (error) {
      console.error('Exception testing table structure:', error);
    }
  }
}

// Asset Maintenance operations
export const assetMaintenanceService = {
  async getAll(): Promise<AssetMaintenance[]> {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .select('*')
      .order('performed_date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getByAsset(assetId: string): Promise<AssetMaintenance[]> {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .select('*')
      .eq('asset_id', assetId)
      .order('performed_date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(maintenance: Omit<AssetMaintenance, 'id' | 'created_at'>): Promise<AssetMaintenance> {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .insert([maintenance])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<AssetMaintenance>): Promise<AssetMaintenance> {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('asset_maintenance')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
