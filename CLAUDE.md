@AGENTS.md

## Deployment — MANDATORY

This project deploys to a **Google Cloud VM**, NOT Vercel. Every time you push code, you MUST deploy it to the VM. Never skip this step. Never try Vercel.

```bash
gcloud compute ssh reviewredact --zone us-central1-a --command "cd /home/ianrakow/reviewredact-app && git pull origin main && npm install && npm run build && pm2 restart all"
```

- **VM:** reviewredact (us-central1-a)
- **IP:** 34.56.182.230
- **App path:** /home/ianrakow/reviewredact-app
- **Process manager:** PM2 (process name: reviewredact)

If you push to GitHub without deploying to the VM, the changes will NOT go live. Always push AND deploy in the same step.
