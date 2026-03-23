# Custom .tech Domain Setup Guide

To use a custom `.tech` domain with your CarRent Manager app (hosted on GitHub Pages), follow these steps.

## 1. Obtaining a Free .tech Domain
If you are a student, you can get a free `.tech` domain for 1 year through the **GitHub Student Developer Pack**:
1.  Apply at [education.github.com/pack](https://education.github.com/pack).
2.  Once approved, find the **.tech Domains** offer in the pack.
3.  Follow the link to claim your domain (verification via GitHub is required).

## 2. Configure DNS Records
Login to your domain registrar (e.g., get.tech, Namecheap) and add the following records:

| Type | Name | Value |
| :--- | :--- | :--- |
| **CNAME** | `www` | `vemulaharshavardhangoud.github.io` |
| **A** | `@` | `185.199.108.153` |
| **A** | `@` | `185.199.109.153` |
| **A** | `@` | `185.199.110.153` |
| **A** | `@` | `185.199.111.153` |

## 3. Configure GitHub Pages
1.  In your GitHub repository, go to **Settings > Pages**.
2.  Under **Custom domain**, enter your new domain (e.g., `yourbrand.tech`).
3.  Click **Save**.
4.  Ensure **Enforce HTTPS** is checked (it may take a few minutes for the certificate to issue).

## 4. Add CNAME File (Automated)
I will add a `CNAME` file to your `public/` folder so that future deployments don't overwrite your domain settings.

> [!NOTE]
> DNS changes can take up to 24-48 hours to propagate globally, although they often work within an hour.
