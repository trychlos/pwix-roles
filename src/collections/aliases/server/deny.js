
import { rolesAliases } from '../aliases.js';

// Deny all client-side updates
// cf. https://guide.meteor.com/security.html#allow-deny

rolesAliases.deny({
    insert(){ return true; },
    update(){ return true; },
    remove(){ return true; },
});
