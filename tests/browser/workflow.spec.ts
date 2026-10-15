import {test,expect} from '@playwright/test';
test('propriedade persiste e alertas simulados são deduplicados',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Minhas propriedades',exact:true}).click();
 await page.getByRole('button',{name:'Nova propriedade'}).click();
 await page.getByPlaceholder('Ex.: Fazenda Boa Esperança').fill('Fazenda Teste');
 await page.getByRole('button',{name:'Salvar propriedade'}).click();
 await expect(page.getByRole('heading',{name:'Fazenda Teste'})).toBeVisible();
 await page.reload();
 await page.getByRole('button',{name:'Minhas propriedades',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Fazenda Teste'})).toBeVisible();
 await page.getByRole('button',{name:'Alertas e riscos',exact:true}).click();
 await page.getByRole('button',{name:'Simular condição'}).click();
 await page.getByRole('button',{name:'Executar simulação'}).click();
 await expect(page.getByRole('heading',{name:'Prévia no WhatsApp'})).toBeVisible();
 await page.getByRole('button',{name:'Fechar',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Chuva excessiva em Sorriso'})).toBeVisible();
 await page.getByRole('button',{name:'Simular condição'}).click();
 await page.getByRole('button',{name:'Executar simulação'}).click();
 await expect(page.getByText('Alerta já registrado para esta regra e período. Duplicata evitada.')).toBeVisible();
});
test('layout móvel não excede a largura da tela',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.getByRole('heading',{name:'Bom dia, João'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
