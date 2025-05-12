
import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsersAdminApi, approveOrganizerAdminApi, updateUserAdminApi, deleteUserAdminApi } from '../../api/admin';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';

const UserManagement = ({ initialFilter = 'all' }) => { 
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', role: '', isApproved: false, organizationName: '' });
    
    
    
    const [currentUserFilter, setCurrentUserFilter] = useState(initialFilter); 
    
    const filterToTabIndex = (filter) => {
        if (filter === 'organizers') return 1;
        if (filter === 'pendingOrganizers') return 2;
        return 0; 
    };
    const [currentSubTab, setCurrentSubTab] = useState(filterToTabIndex(initialFilter));


    const fetchUsers = useCallback(async (filterToFetch) => { 
        setIsLoading(true);
        setError(null);
        let params = {};
        if (filterToFetch === 'organizers' || filterToFetch === 'pendingOrganizers') {
            params.role = 'organizer';
        }

        try {
            const data = await getAllUsersAdminApi(params);
            if (filterToFetch === 'pendingOrganizers') {
                setUsers(data.filter(user => user.role === 'organizer' && !user.isApproved));
            } else if (filterToFetch === 'organizers') {
                setUsers(data.filter(user => user.role === 'organizer'));
            }
             else { 
                setUsers(data);
            }
        } catch (err) {
            setError(err.message || 'Failed to load users.');
        } finally {
            setIsLoading(false);
        }
    }, []); 

    useEffect(() => {
        
        fetchUsers(currentUserFilter);
    }, [fetchUsers, currentUserFilter]); 

    
    useEffect(() => {
        setCurrentUserFilter(initialFilter);
        setCurrentSubTab(filterToTabIndex(initialFilter));
    }, [initialFilter]);


    const handleSubTabChange = (event, newValue) => {
        setCurrentSubTab(newValue);
        switch (newValue) {
            case 0: setCurrentUserFilter('all'); break;
            case 1: setCurrentUserFilter('organizers'); break;
            case 2: setCurrentUserFilter('pendingOrganizers'); break;
            default: setCurrentUserFilter('all');
        }
    };

    
    const handleApproveOrganizer = async (organizerId) => {
        try {
            await approveOrganizerAdminApi(organizerId);
            fetchUsers(currentUserFilter); 
        } catch (err) {
            alert(`Failed to approve organizer: ${err.message || 'Server error'}`);
        }
    };

    const handleOpenEditModal = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'user',
            isApproved: user.isApproved || false,
            organizationName: user.organizationName || ''
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedUser(null);
    };

    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleEditFormSwitchChange = (e) => { 
        setEditFormData(prev => ({...prev, [e.target.name]: e.target.checked,
        }));
    };


    const handleSaveUserChanges = async () => {
        if (!selectedUser) return;
        setError(null); 
        try {
            const updateData = {
                name: editFormData.name,
                role: editFormData.role,
            };
            if (editFormData.role === 'organizer') {
                updateData.isApproved = editFormData.isApproved;
                updateData.organizationName = editFormData.organizationName;
            } else { 
                updateData.organizationName = undefined; 
                updateData.isApproved = editFormData.role === 'user' ? true : false; 
            }
            await updateUserAdminApi(selectedUser._id, updateData);
            fetchUsers(currentUserFilter); 
            handleCloseEditModal();
        } catch (err) {
            const apiError = err.errors ? err.errors.map(e => e.msg).join(', ') : (err.msg || err.message || 'Failed to update user.');
            setError(apiError); 
        }
    };
    
    const handleOpenDeleteModal = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await deleteUserAdminApi(selectedUser._id);
            fetchUsers(currentUserFilter); 
            handleCloseDeleteModal();
        } catch (err) {
            alert(`Failed to delete user: ${err.message || 'Server error'}`);
        }
    };


    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={currentSubTab} onChange={handleSubTabChange} aria-label="user filter tabs">
                    <Tab label="All Users" />
                    <Tab label="All Organizers" />
                    <Tab label="Pending Approvals" />
                </Tabs>
            </Box>

            {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>}
            {error && !isEditModalOpen && <Alert severity="error">{error}</Alert>}

            {!isLoading && !error && users.length === 0 && <Typography sx={{p:2, textAlign: 'center'}}>No users found for this filter.</Typography>}
            
            {!isLoading && users.length > 0 && (
                 <List component={Paper} elevation={0} variant="outlined">
                 {users.map((user, index) => (
                     <React.Fragment key={user._id}>
                         <ListItem sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2 }}>
                             <ListItemText
                                 primaryTypographyProps={{variant: 'subtitle1', fontWeight: 'medium'}}
                                 primary={`${user.name} (${user.email})`}
                                 secondary={
                                     <Box component="span" sx={{ display: 'block', mt: 0.5}}>
                                         Role: <Chip label={user.role} size="small" variant="outlined" color={user.role === 'admin' ? 'secondary' : user.role === 'organizer' ? 'info' : 'default'} sx={{ mr: 1 }} />
                                         {user.role === 'organizer' && (
                                             <>
                                                 Status: <Chip label={user.isApproved ? 'Approved' : 'Pending'} size="small" variant="outlined" color={user.isApproved ? 'success' : 'warning'} />
                                                 <Typography component="span" variant="body2" sx={{display: 'block', mt: 0.5}}>Org: {user.organizationName || 'N/A'}</Typography>
                                             </>
                                         )}
                                     </Box>
                                 }
                             />
                             <Box sx={{display: 'flex', gap: 1, mt: {xs: 1, sm: 0}}}>
                                 {user.role === 'organizer' && !user.isApproved && (
                                     <Button variant="contained" color="success" size="small" onClick={() => handleApproveOrganizer(user._id)}>Approve</Button>
                                 )}
                                 <Button variant="outlined" size="small" onClick={() => handleOpenEditModal(user)}>Edit</Button>
                                 {user.role !== 'admin' &&
                                     <Button variant="outlined" color="error" size="small" onClick={() => handleOpenDeleteModal(user)}>Delete</Button>
                                 }
                             </Box>
                         </ListItem>
                         {index < users.length - 1 && <Divider component="li" />}
                     </React.Fragment>
                 ))}
             </List>
            )}

            <Dialog open={isEditModalOpen} onClose={handleCloseEditModal} maxWidth="sm" fullWidth>
                <DialogTitle>Edit User: {selectedUser?.name}</DialogTitle>
                <DialogContent>
                    {error && isEditModalOpen && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
                    <TextField margin="dense" name="name" label="Name" type="text" fullWidth variant="outlined" value={editFormData.name} onChange={handleEditFormChange}/>
                    <TextField margin="dense" name="email" label="Email" type="email" fullWidth variant="outlined" value={editFormData.email} disabled/>
                    <FormControl fullWidth margin="dense">
                        <InputLabel id="role-select-label">Role</InputLabel>
                        <Select labelId="role-select-label" name="role" value={editFormData.role} label="Role" onChange={handleEditFormChange}>
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="organizer">Organizer</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem> {/* Be careful enabling this */}
                        </Select>
                    </FormControl>
                    {editFormData.role === 'organizer' && (
                        <>
                            <TextField margin="dense" name="organizationName" label="Organization Name" type="text" fullWidth variant="outlined" value={editFormData.organizationName} onChange={handleEditFormChange}/>
                            <FormControlLabel control={<Switch checked={editFormData.isApproved} onChange={handleEditFormSwitchChange} name="isApproved" />} label="Is Approved" sx={{mt:1}}/>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditModal}>Cancel</Button>
                    <Button onClick={handleSaveUserChanges} variant="contained" color="primary">Save Changes</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isDeleteModalOpen} onClose={handleCloseDeleteModal}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete user: {selectedUser?.name} ({selectedUser?.email})? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteModal}>Cancel</Button>
                    <Button onClick={handleDeleteUser} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;